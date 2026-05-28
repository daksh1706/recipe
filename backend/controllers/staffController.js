import { supabase } from '../config/supabase.js';

// Retrieve full roster list
export const getStaffRoster = async (req, res) => {
  try {
    const { data: roster, error } = await supabase
      .from('staff_roster')
      .select('*, user:users(*)')
      .eq('workspace_id', req.workspace_id);

    if (error) throw error;

    const mapped = roster.map(r => ({
      ...r,
      _id: r.id,
      userId: r.user_id,
      monthlySalary: Number(r.monthly_salary || 0),
      joiningDate: r.joining_date,
      emergencyContact: r.emergency_contact,
      isActive: r.is_active,
      workingDays: r.working_days || [],
      user: r.user ? {
        id: r.user.id,
        email: r.user.email,
        fullName: r.user.full_name,
        role: r.user.role,
        phone: r.user.phone
      } : null
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add or update staff roster record
export const saveStaffRoster = async (req, res) => {
  const { userId, role, shift, workingDays, monthlySalary, joiningDate, emergencyContact, isActive } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const payload = {
    user_id: userId,
    role: role || 'cashier',
    shift: shift || 'morning',
    working_days: workingDays || [],
    monthly_salary: Number(monthlySalary || 0),
    joining_date: joiningDate || new Date().toISOString().split('T')[0],
    emergency_contact: emergencyContact || '',
    is_active: isActive !== false,
    workspace_id: req.workspace_id
  };

  try {
    // Check if user exists in roster
    const { data: existing } = await supabase
      .from('staff_roster')
      .select('id')
      .eq('user_id', userId)
      .eq('workspace_id', req.workspace_id)
      .maybeSingle();

    let record, error;

    if (existing) {
      const { data, error: err } = await supabase
        .from('staff_roster')
        .update(payload)
        .eq('user_id', userId)
        .eq('workspace_id', req.workspace_id)
        .select()
        .single();
      record = data;
      error = err;
    } else {
      const { data, error: err } = await supabase
        .from('staff_roster')
        .insert(payload)
        .select()
        .single();
      record = data;
      error = err;
    }

    if (error) throw error;

    // Update corresponding role in users table too
    await supabase.from('users').update({ role: payload.role }).eq('id', userId).eq('workspace_id', req.workspace_id);

    res.json({
      ...record,
      _id: record.id,
      userId: record.user_id,
      monthlySalary: Number(record.monthly_salary)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete staff roster record
export const deleteStaffRoster = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('staff_roster')
      .delete()
      .eq('id', id)
      .eq('workspace_id', req.workspace_id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      res.json({ message: 'Staff roster record deleted successfully' });
    } else {
      res.status(404).json({ message: 'Staff roster record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Staff Performance details (total orders handled, revenue generated)
export const getStaffPerformance = async (req, res) => {
  try {
    // Retrieve users
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('workspace_id', req.workspace_id);

    if (userErr) throw userErr;

    // Retrieve active orders totals grouped by staff_id
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select('id, grand_total, staff_id')
      .eq('workspace_id', req.workspace_id)
      .neq('status', 'cancelled');

    if (ordErr) throw ordErr;

    // Compile statistics
    const stats = users.map(u => {
      const userOrders = orders.filter(o => o.staff_id === u.id);
      const orderCount = userOrders.length;
      const totalRevenue = userOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);

      return {
        id: u.id,
        _id: u.id,
        email: u.email,
        fullName: u.full_name || u.email.split('@')[0],
        role: u.role,
        totalOrdersHandled: orderCount,
        totalRevenueGenerated: totalRevenue
      };
    });

    // Filter out users who have zero orders and aren't cashier/barista to keep it clean
    const filtered = stats.filter(s => s.totalOrdersHandled > 0 || ['barista', 'cashier', 'waiter'].includes(s.role));

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
