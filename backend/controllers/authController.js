import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { obfuscateCode } from '../config/obfuscation.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { email, password, full_name, role, phone, share_code } = req.body;

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
    const status = 'approved';

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

    // Fail-safe status check: if database defaults or triggers forced status to 'pending', immediately update it to 'approved'
    if (user && user.status !== 'approved') {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', user.id)
        .select()
        .single();
      if (!updateError && updatedUser) {
        user.status = 'approved';
      }
    }

    let finalWorkspaceId = null;
    if (user && targetRole === 'admin') {
      if (share_code && share_code.trim().length === 6 && !isNaN(share_code.trim())) {
        // ── JOIN EXISTING WORKSPACE as a co-admin/founder ──
        const obfuscated = obfuscateCode(share_code.trim());

        const { data: workspace, error: wsError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('share_code', obfuscated)
          .maybeSingle();

        if (wsError) throw wsError;

        if (!workspace) {
          // Invalid share code — roll back user creation and return error
          await supabase.from('users').delete().eq('id', user.id);
          return res.status(404).json({ message: 'Workspace share code not found. Please check the invite code and try again.' });
        }

        // Add as owner-level member with immediate approval
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'owner',
            status: 'approved'
          });

        if (memberError) throw memberError;

        // Link user to the workspace
        const { error: userError } = await supabase
          .from('users')
          .update({ workspace_id: workspace.id })
          .eq('id', user.id);

        if (userError) throw userError;

        finalWorkspaceId = workspace.id;
      } else {
        // ── CREATE NEW WORKSPACE (original behaviour) ──
        const workspaceName = `${user.full_name || 'My'}'s Workspace`;
        let unique = false;
        let shareCode = '';
        let obfuscated = '';

        while (!unique) {
          shareCode = Math.floor(100000 + Math.random() * 900000).toString();
          obfuscated = obfuscateCode(shareCode);
          
          const { data: existing } = await supabase
            .from('workspaces')
            .select('id')
            .eq('share_code', obfuscated)
            .maybeSingle();

          if (!existing) {
            unique = true;
          }
        }

        // Create the workspace
        const { data: workspace, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            workspace_name: workspaceName,
            owner_id: user.id,
            share_code: obfuscated
          })
          .select()
          .single();

        if (wsError) throw wsError;

        // Register user as owner in workspace_members
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'owner'
          });

        if (memberError) throw memberError;

        // Update user's active workspace_id
        const { error: userError } = await supabase
          .from('users')
          .update({ workspace_id: workspace.id })
          .eq('id', user.id);

        if (userError) throw userError;

        finalWorkspaceId = workspace.id;
      }
    }

    if (user) {
      res.status(201).json({
        _id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        workspace_id: finalWorkspaceId || user.workspace_id || null,
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

    // Check status - automatically auto-approve pending users to allow them in
    if (user.status === 'pending') {
      await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', user.id);
      user.status = 'approved';
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
      workspace_id: user.workspace_id || null,
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
      .select('id, email, full_name, role, phone, is_active, status, workspace_id, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
