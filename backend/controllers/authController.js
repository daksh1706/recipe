import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { email, password, full_name, role, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const targetRole = role ? role.toLowerCase() : 'cashier';
    const isOwnerEmail = ['dakshmaru10@gmail.com', 'test@gmail.com'].includes(email.toLowerCase());
    const isAutoApproved = isOwnerEmail || targetRole === 'admin';
    const status = isAutoApproved ? 'approved' : 'pending';

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password: hashedPassword,
        full_name: full_name || email.split('@')[0],
        role: targetRole,
        phone: phone || '',
        status,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    if (user) {
      res.status(201).json({
        _id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, username, password } = req.body;
  
  // Accept either email or username field to maintain backwards compatibility
  const loginEmail = (email || username || '').toLowerCase();

  if (!loginEmail || !password) {
    return res.status(400).json({ message: 'Email/Username and password are required' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', loginEmail)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact the Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    // Check status
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending Admin approval. You will be able to log in once approved.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Access Request Denied' });
    }

    res.json({
      _id: user.id,
      email: user.email,
      username: user.email, // compatibility
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, phone, is_active, status, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
