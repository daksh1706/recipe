import { supabase } from '../config/supabase.js';

export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    let query = supabase
      .from('expenses')
      .select('*, recorded_user:users(*)')
      .eq('workspace_id', req.workspace_id)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) query = query.lte('created_at', new Date(endDate).toISOString());

    const { data: expenses, error } = await query;
    if (error) throw error;

    const mapped = expenses.map(e => ({
      ...e,
      _id: e.id,
      paymentMethod: e.payment_method,
      paidTo: e.paid_to,
      receiptUrl: e.receipt_url,
      recordedBy: e.recorded_by,
      recordedUser: e.recorded_user ? { id: e.recorded_user.id, email: e.recorded_user.email, fullName: e.recorded_user.full_name } : null
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpenseSummary = async (req, res) => {
  try {
    // Current month summary
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('workspace_id', req.workspace_id)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    let total = 0;
    const categoryTotals = {
      rent: 0,
      electricity: 0,
      staff_salary: 0,
      raw_materials: 0,
      packaging: 0,
      equipment: 0,
      marketing: 0,
      maintenance: 0,
      miscellaneous: 0
    };

    expenses.forEach(e => {
      const amt = Number(e.amount);
      total += amt;
      if (categoryTotals[e.category] !== undefined) {
        categoryTotals[e.category] += amt;
      } else {
        categoryTotals[e.category] = amt;
      }
    });

    res.json({
      totalExpenses: total,
      breakdown: categoryTotals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addExpense = async (req, res) => {
  const { category, description, amount, paymentMethod, payment_method, paidTo, paid_to, receiptUrl, receipt_url, notes } = req.body;

  try {
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        category,
        description: description || '',
        amount: Number(amount),
        payment_method: paymentMethod || payment_method || 'cash',
        paid_to: paidTo || paid_to || '',
        receipt_url: receiptUrl || receipt_url || '',
        notes: notes || '',
        recorded_by: req.user ? req.user.id : null,
        workspace_id: req.workspace_id
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = {
      ...expense,
      _id: expense.id,
      paymentMethod: expense.payment_method,
      paidTo: expense.paid_to,
      receiptUrl: expense.receipt_url
    };

    res.status(201).json(mapped);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { category, description, amount, paymentMethod, payment_method, paidTo, paid_to, receiptUrl, receipt_url, notes } = req.body;

  const updates = {};
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description;
  if (amount !== undefined) updates.amount = Number(amount);
  
  if (paymentMethod !== undefined) updates.payment_method = paymentMethod;
  else if (payment_method !== undefined) updates.payment_method = payment_method;

  if (paidTo !== undefined) updates.paid_to = paidTo;
  else if (paid_to !== undefined) updates.paid_to = paid_to;

  if (receiptUrl !== undefined) updates.receipt_url = receiptUrl;
  else if (receipt_url !== undefined) updates.receipt_url = receipt_url;

  if (notes !== undefined) updates.notes = notes;

  try {
    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', req.workspace_id)
      .select()
      .single();

    if (error) throw error;

    const mapped = {
      ...expense,
      _id: expense.id,
      paymentMethod: expense.payment_method,
      paidTo: expense.paid_to,
      receiptUrl: expense.receipt_url
    };

    res.json(mapped);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('workspace_id', req.workspace_id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      res.json({ message: 'Expense record deleted' });
    } else {
      res.status(404).json({ message: 'Expense record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
