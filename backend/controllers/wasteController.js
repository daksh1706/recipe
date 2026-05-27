import { supabase } from '../config/supabase.js';

export const getWasteLogs = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.query;

    let query = supabase
      .from('waste_log')
      .select('*, raw_material:raw_materials(*), recorded_user:users(*)')
      .order('created_at', { ascending: false });

    if (reason) query = query.eq('reason', reason);
    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) query = query.lte('created_at', new Date(endDate).toISOString());

    const { data: logs, error } = await query;
    if (error) throw error;

    const mapped = logs.map(l => ({
      ...l,
      _id: l.id,
      rawMaterialId: l.raw_material_id,
      recordedBy: l.recorded_by,
      estimatedLoss: Number(l.estimated_loss || 0),
      quantity: Number(l.quantity || 0),
      rawMaterialName: l.raw_material ? l.raw_material.name : 'Unknown Raw Material',
      rawMaterial: l.raw_material,
      recordedUser: l.recorded_user ? { id: l.recorded_user.id, fullName: l.recorded_user.full_name } : null
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addWasteLog = async (req, res) => {
  const { rawMaterialId, raw_material_id, quantity, unit, reason, notes } = req.body;
  const targetMatId = rawMaterialId || raw_material_id;

  if (!targetMatId || !quantity || !reason) {
    return res.status(400).json({ message: 'Raw material ID, quantity, and reason are required' });
  }

  try {
    // Fetch raw material details for cost and current stock
    const { data: rawMaterial, error: matErr } = await supabase
      .from('raw_materials')
      .select('current_stock, cost_per_unit, name, unit')
      .eq('id', targetMatId)
      .single();

    if (matErr || !rawMaterial) {
      return res.status(404).json({ message: 'Raw material not found' });
    }

    const cost = Number(rawMaterial.cost_per_unit || 0);
    const estLoss = cost * Number(quantity);

    // Update raw materials stock (deduct the waste quantity)
    const newStock = Math.max(0, Number(rawMaterial.current_stock || 0) - Number(quantity));
    await supabase
      .from('raw_materials')
      .update({ current_stock: newStock })
      .eq('id', targetMatId);

    // Create waste log record
    const { data: log, error: logErr } = await supabase
      .from('waste_log')
      .insert({
        raw_material_id: targetMatId,
        quantity: Number(quantity),
        unit: unit || rawMaterial.unit || 'g',
        reason: reason.toLowerCase(),
        estimated_loss: estLoss,
        recorded_by: req.user ? req.user.id : null,
        notes: notes || ''
      })
      .select()
      .single();

    if (logErr) throw logErr;

    // Log stock transaction
    await supabase.from('stock_transactions').insert({
      raw_material_id: targetMatId,
      transaction_type: 'waste',
      quantity: Number(quantity),
      reference_id: log.id,
      notes: `Waste log: ${reason.toLowerCase()}. Note: ${notes || ''}`
    });

    if (req.io) {
      req.io.emit('inventory_updated', {
        type: 'update',
        item: { _id: targetMatId, currentStock: newStock, name: rawMaterial.name }
      });
    }

    res.status(201).json({
      ...log,
      _id: log.id,
      estimatedLoss: Number(log.estimated_loss)
    });
  } catch (error) {
    console.error("Waste logging error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getWasteSummary = async (req, res) => {
  try {
    // Current month summary
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const { data: logs, error } = await supabase
      .from('waste_log')
      .select('*')
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    let totalItems = 0;
    let totalLoss = 0;
    const reasonBreakdown = {
      expired: 0,
      overcooked: 0,
      dropped: 0,
      unsold: 0,
      spoiled: 0,
      other: 0
    };

    logs.forEach(l => {
      totalItems += Number(l.quantity || 0);
      const loss = Number(l.estimated_loss || 0);
      totalLoss += loss;
      
      const r = l.reason.toLowerCase();
      if (reasonBreakdown[r] !== undefined) {
        reasonBreakdown[r] += loss;
      } else {
        reasonBreakdown[r] = (reasonBreakdown[r] || 0) + loss;
      }
    });

    res.json({
      totalWastedQuantity: totalItems,
      totalWastedLoss: totalLoss,
      breakdown: reasonBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
