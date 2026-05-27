import { supabase } from '../config/supabase.js';

// Get all raw materials (ingredients)
export const getRawMaterials = async (req, res) => {
  try {
    const { data: materials, error } = await supabase
      .from('raw_materials')
      .select('*, supplier:suppliers(*)')
      .order('name');

    if (error) throw error;

    // Map output to match frontend camelCase compatibility
    const formatted = materials.map(mat => {
      const current = Number(mat.current_stock || 0);
      const min = Number(mat.minimum_stock_level || 0);
      
      let status = 'in_stock';
      if (current === 0) status = 'out_of_stock';
      else if (current <= min) status = 'low_stock';

      return {
        _id: mat.id,
        id: mat.id,
        itemCode: mat.item_code,
        name: mat.name,
        category: mat.category,
        unit: mat.unit,
        currentStock: current,
        minimumStockLevel: min,
        reorderQuantity: Number(mat.reorder_quantity || 0),
        costPerUnit: Number(mat.cost_per_unit || 0),
        totalValue: current * Number(mat.cost_per_unit || 0),
        supplierId: mat.supplier_id,
        storageLocation: mat.storage_location || '',
        expiryDate: mat.expiry_date,
        lastRestockedAt: mat.last_restocked_at,
        createdAt: mat.created_at,
        status, // auto calculated
        supplier: mat.supplier
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new raw material
export const addRawMaterial = async (req, res) => {
  const { itemCode, item_code, name, category, unit, currentStock, current_stock, minimumStockLevel, minimum_stock_level, reorderQuantity, reorder_quantity, costPerUnit, cost_per_unit, supplierId, supplier_id, storageLocation, storage_location, expiryDate, expiry_date } = req.body;

  const finalCode = itemCode || item_code || `RM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const finalStock = currentStock !== undefined ? currentStock : (current_stock !== undefined ? current_stock : 0.0);
  const finalMin = minimumStockLevel !== undefined ? minimumStockLevel : (minimum_stock_level !== undefined ? minimum_stock_level : 10.0);
  const finalReorder = reorderQuantity !== undefined ? reorderQuantity : (reorder_quantity !== undefined ? reorder_quantity : 50.0);
  const finalCost = costPerUnit !== undefined ? costPerUnit : (cost_per_unit !== undefined ? cost_per_unit : 0.0);
  const finalSupplier = supplierId || supplier_id || null;
  const finalLoc = storageLocation || storage_location || '';
  const finalExpiry = expiryDate || expiry_date || null;

  try {
    const { data: mat, error } = await supabase
      .from('raw_materials')
      .insert({
        item_code: finalCode,
        name,
        category,
        unit,
        current_stock: Number(finalStock),
        minimum_stock_level: Number(finalMin),
        reorder_quantity: Number(finalReorder),
        cost_per_unit: Number(finalCost),
        supplier_id: finalSupplier,
        storage_location: finalLoc,
        expiry_date: finalExpiry,
        last_restocked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Log the initial stock if greater than 0
    if (Number(finalStock) > 0) {
      await supabase.from('stock_transactions').insert({
        raw_material_id: mat.id,
        transaction_type: 'restock',
        quantity: Number(finalStock),
        notes: 'Initial stock intake on creation'
      });
    }

    const responseItem = {
      ...mat,
      _id: mat.id,
      itemCode: mat.item_code,
      currentStock: mat.current_stock,
      minimumStockLevel: mat.minimum_stock_level,
      reorderQuantity: mat.reorder_quantity,
      costPerUnit: mat.cost_per_unit,
      storageLocation: mat.storage_location,
      expiryDate: mat.expiry_date,
      lastRestockedAt: mat.last_restocked_at
    };

    if (req.io) {
      req.io.emit('inventory_updated', { type: 'add', item: responseItem });
    }

    res.status(201).json(responseItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update raw material details
export const updateRawMaterial = async (req, res) => {
  const { id } = req.params;
  const { itemCode, item_code, name, category, unit, currentStock, current_stock, minimumStockLevel, minimum_stock_level, reorderQuantity, reorder_quantity, costPerUnit, cost_per_unit, supplierId, supplier_id, storageLocation, storage_location, expiryDate, expiry_date } = req.body;

  const updates = {};
  if (itemCode !== undefined) updates.item_code = itemCode;
  else if (item_code !== undefined) updates.item_code = item_code;

  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category;
  if (unit !== undefined) updates.unit = unit;

  if (currentStock !== undefined) updates.current_stock = Number(currentStock);
  else if (current_stock !== undefined) updates.current_stock = Number(current_stock);

  if (minimumStockLevel !== undefined) updates.minimum_stock_level = Number(minimumStockLevel);
  else if (minimum_stock_level !== undefined) updates.minimum_stock_level = Number(minimum_stock_level);

  if (reorderQuantity !== undefined) updates.reorder_quantity = Number(reorderQuantity);
  else if (reorder_quantity !== undefined) updates.reorder_quantity = Number(reorder_quantity);

  if (costPerUnit !== undefined) updates.cost_per_unit = Number(costPerUnit);
  else if (cost_per_unit !== undefined) updates.cost_per_unit = Number(cost_per_unit);

  if (supplierId !== undefined) updates.supplier_id = supplierId;
  else if (supplier_id !== undefined) updates.supplier_id = supplier_id;

  if (storageLocation !== undefined) updates.storage_location = storageLocation;
  else if (storage_location !== undefined) updates.storage_location = storage_location;

  if (expiryDate !== undefined) updates.expiry_date = expiryDate;
  else if (expiry_date !== undefined) updates.expiry_date = expiry_date;

  try {
    const { data: mat, error } = await supabase
      .from('raw_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const responseItem = {
      ...mat,
      _id: mat.id,
      itemCode: mat.item_code,
      currentStock: mat.current_stock,
      minimumStockLevel: mat.minimum_stock_level,
      reorderQuantity: mat.reorder_quantity,
      costPerUnit: mat.cost_per_unit,
      storageLocation: mat.storage_location,
      expiryDate: mat.expiry_date,
      lastRestockedAt: mat.last_restocked_at
    };

    if (req.io) {
      req.io.emit('inventory_updated', { type: 'update', item: responseItem });
    }

    res.json(responseItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete raw material
export const deleteRawMaterial = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('raw_materials')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      if (req.io) req.io.emit('inventory_updated', { type: 'delete', id });
      res.json({ message: 'Raw material removed' });
    } else {
      res.status(404).json({ message: 'Raw material not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restock an existing raw material
export const restockRawMaterial = async (req, res) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;

  if (!quantity || Number(quantity) <= 0) {
    return res.status(400).json({ message: 'Invalid restock quantity. Must be greater than 0.' });
  }

  try {
    // Fetch current stock
    const { data: currentMat, error: fetchErr } = await supabase
      .from('raw_materials')
      .select('current_stock')
      .eq('id', id)
      .single();

    if (fetchErr || !currentMat) {
      return res.status(404).json({ message: 'Raw material not found' });
    }

    const newStock = Number(currentMat.current_stock || 0) + Number(quantity);

    // Update stock and last_restocked_at
    const { data: mat, error: updateErr } = await supabase
      .from('raw_materials')
      .update({
        current_stock: newStock,
        last_restocked_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log the transaction
    await supabase.from('stock_transactions').insert({
      raw_material_id: id,
      transaction_type: 'restock',
      quantity: Number(quantity),
      notes: notes || 'Manual restock intake'
    });

    const responseItem = {
      ...mat,
      _id: mat.id,
      itemCode: mat.item_code,
      currentStock: mat.current_stock,
      minimumStockLevel: mat.minimum_stock_level,
      reorderQuantity: mat.reorder_quantity,
      costPerUnit: mat.cost_per_unit,
      storageLocation: mat.storage_location,
      expiryDate: mat.expiry_date,
      lastRestockedAt: mat.last_restocked_at
    };

    if (req.io) {
      req.io.emit('inventory_updated', { type: 'update', item: responseItem });
    }

    res.json(responseItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Stock Transaction History
export const getStockTransactions = async (req, res) => {
  try {
    const { data: txs, error } = await supabase
      .from('stock_transactions')
      .select('*, raw_material:raw_materials(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = txs.map(t => ({
      ...t,
      _id: t.id,
      rawMaterial: t.raw_material
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
