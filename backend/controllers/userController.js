import { supabase } from '../config/supabase.js';

// Get all users (both approved staff and pending requests)
export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, phone, status, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For backwards compatibility mapping
    const mapped = data.map(u => ({
      ...u,
      _id: u.id,
      username: u.email
    }));
    
    res.json(mapped || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all pending access requests
export const getPendingUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, phone, status, is_active, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = data.map(u => ({
      ...u,
      _id: u.id,
      username: u.email
    }));

    res.json(mapped || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user status (approve/reject/role/active status)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { status, role, full_name, phone, is_active } = req.body;

  const updates = {};
  if (status !== undefined) {
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    updates.status = status;
  }
  if (role !== undefined) {
    updates.role = role.toLowerCase();
  }
  if (full_name !== undefined) {
    updates.full_name = full_name;
  }
  if (phone !== undefined) {
    updates.phone = phone;
  }
  if (is_active !== undefined) {
    updates.is_active = is_active;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, full_name, role, phone, status, is_active')
      .single();

    if (error) throw error;
    
    if (data) {
      res.json({
        ...data,
        _id: data.id,
        username: data.email
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Compatibility endpoint for old updates
export const updateUserStatus = async (req, res) => {
  return updateUser(req, res);
};

// Delete user account
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Safety check - do not delete the admin user
    const { data: checkUser } = await supabase.from('users').select('email').eq('id', id).single();
    if (checkUser && (checkUser.email === 'dakshmaru10@gmail.com' || checkUser.email === 'test@gmail.com')) {
      return res.status(400).json({ message: 'Cannot delete the primary Admin accounts.' });
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    if (data) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
