import { supabase } from '../config/supabase.js';

export const getFeedback = async (req, res) => {
  try {
    const { rating, isResolved, start_date, end_date } = req.query;

    let query = supabase
      .from('feedback')
      .select('*, customer:customers(*), order:orders(*), menu_item:menu_items(*)')
      .eq('workspace_id', req.workspace_id)
      .order('created_at', { ascending: false });

    if (rating) query = query.eq('rating', Number(rating));
    if (isResolved !== undefined) query = query.eq('is_resolved', isResolved === 'true');

    const { data: feedback, error } = await query;
    if (error) throw error;

    const mapped = feedback.map(f => ({
      ...f,
      _id: f.id,
      orderId: f.order_id,
      customerId: f.customer_id,
      menuItemId: f.menu_item_id,
      actionTaken: f.action_taken,
      isResolved: f.is_resolved,
      customerName: f.customer ? f.customer.name : 'Anonymous Walk-in',
      customer: f.customer ? { id: f.customer.id, name: f.customer.name, phone: f.customer.phone } : null,
      order: f.order ? { id: f.order.id, orderCode: f.order.order_code, grandTotal: f.order.grand_total } : null,
      menuItemName: f.menu_item ? f.menu_item.name : 'General Shop'
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFeedback = async (req, res) => {
  const { orderId, customerId, menuItemId, rating, comment } = req.body;

  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const { data: fb, error } = await supabase
      .from('feedback')
      .insert({
        order_id: orderId || null,
        customer_id: customerId || null,
        menu_item_id: menuItemId || null,
        rating: Number(rating),
        comment: comment || '',
        is_resolved: false,
        action_taken: '',
        workspace_id: req.workspace_id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      ...fb,
      _id: fb.id,
      isResolved: fb.is_resolved
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resolveFeedback = async (req, res) => {
  const { id } = req.params;
  const { actionTaken } = req.body;

  if (!actionTaken) {
    return res.status(400).json({ message: 'Action taken note is required to resolve feedback' });
  }

  try {
    const { data: fb, error } = await supabase
      .from('feedback')
      .update({
        is_resolved: true,
        action_taken: actionTaken
      })
      .eq('id', id)
      .eq('workspace_id', req.workspace_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...fb,
      _id: fb.id,
      isResolved: fb.is_resolved,
      actionTaken: fb.action_taken
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getFeedbackSummary = async (req, res) => {
  try {
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('rating')
      .eq('workspace_id', req.workspace_id);

    if (error) throw error;

    let total = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    feedback.forEach(f => {
      const r = f.rating;
      total += r;
      if (distribution[r] !== undefined) {
        distribution[r]++;
      }
    });

    const count = feedback.length;
    const avg = count > 0 ? Number((total / count).toFixed(2)) : 0;

    res.json({
      averageRating: avg,
      totalFeedback: count,
      distribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
