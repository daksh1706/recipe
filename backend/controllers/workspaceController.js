import { supabase } from '../config/supabase.js';
import { obfuscateCode, deobfuscateCode } from '../config/obfuscation.js';

// Helper to generate a 6-digit numeric code
const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. Create a New Workspace
export const createWorkspace = async (req, res) => {
  const { workspace_name } = req.body;
  if (!workspace_name) {
    return res.status(400).json({ message: 'Workspace name is required' });
  }

  try {
    // Generate unique 6-digit code
    let unique = false;
    let shareCode = '';
    let obfuscated = '';

    while (!unique) {
      shareCode = generate6DigitCode();
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
        workspace_name,
        owner_id: req.user.id,
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
        user_id: req.user.id,
        role: 'owner'
      });

    if (memberError) throw memberError;

    // Update user's active workspace_id
    const { error: userError } = await supabase
      .from('users')
      .update({ workspace_id: workspace.id })
      .eq('id', req.user.id);

    if (userError) throw userError;

    res.status(201).json({
      id: workspace.id,
      workspace_name: workspace.workspace_name,
      share_code: shareCode, // return raw 6 digit code on creation
      role: 'owner'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Join an Existing Workspace with Rate Limiting
export const joinWorkspace = async (req, res) => {
  const { share_code } = req.body;
  if (!share_code || share_code.length !== 6 || isNaN(share_code)) {
    return res.status(400).json({ message: 'A valid 6-digit numeric code is required' });
  }

  // Get Client IP
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';

  try {
    // Enforce Rate Limiting: Max 5 failed attempts per IP per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: failedAttempts, error: countError } = await supabase
      .from('workspace_join_attempts')
      .select('id')
      .eq('ip_address', ipAddress)
      .eq('success', false)
      .gte('attempted_at', oneHourAgo);

    if (countError) throw countError;

    if (failedAttempts && failedAttempts.length >= 5) {
      return res.status(429).json({ 
        message: 'Too many failed join attempts. Please try again in an hour to protect security.' 
      });
    }

    // Obfuscate entered code to find the workspace
    const obfuscated = obfuscateCode(share_code.trim());

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('share_code', obfuscated)
      .maybeSingle();

    if (wsError) throw wsError;

    if (!workspace) {
      // Log Failed Attempt
      await supabase.from('workspace_join_attempts').insert({
        ip_address: ipAddress,
        success: false
      });

      return res.status(404).json({ message: 'Workspace share invitation code not found.' });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!existingMember) {
      // Register user as member
      const { error: joinError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: req.user.id,
          role: 'member'
        });

      if (joinError) throw joinError;
    }

    // Update user's active workspace_id
    const { error: userError } = await supabase
      .from('users')
      .update({ workspace_id: workspace.id })
      .eq('id', req.user.id);

    if (userError) throw userError;

    // Log Successful Attempt
    await supabase.from('workspace_join_attempts').insert({
      workspace_id: workspace.id,
      ip_address: ipAddress,
      success: true
    });

    res.json({
      message: 'Successfully joined workspace!',
      id: workspace.id,
      workspace_name: workspace.workspace_name,
      role: 'member'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get Workspace Stats, Information, and Members
export const getWorkspaceInfo = async (req, res) => {
  try {
    // Fetch Workspace record
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', req.workspace_id)
      .single();

    if (wsError) throw wsError;

    const isOwner = workspace.owner_id === req.user.id || req.user.role === 'admin';
    let shareCode = null;

    if (isOwner) {
      shareCode = deobfuscateCode(workspace.share_code) || 'N/A';
    }

    // Fetch members list
    const { data: members, error: mError } = await supabase
      .from('workspace_members')
      .select('role, joined_at, user:users(id, email, full_name)')
      .eq('workspace_id', req.workspace_id);

    if (mError) throw mError;

    // Format member results
    const formattedMembers = members.map(m => ({
      userId: m.user?.id || 'unknown',
      email: m.user?.email || 'N/A',
      name: m.user?.full_name || 'Unnamed',
      role: m.role,
      joinedAt: m.joined_at
    }));

    res.json({
      workspaceId: workspace.id,
      name: workspace.workspace_name,
      shareCode, // plain text only for owner, null for members
      isOwner,
      members: formattedMembers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Regenerate Workspace 6-Digit Share Invitation Code
export const regenerateShareCode = async (req, res) => {
  try {
    // Safety check: verify ownership
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', req.workspace_id)
      .single();

    if (wsError) throw wsError;

    if (workspace.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the workspace owner is authorized to regenerate invite codes.' });
    }

    // Generate new unique 6-digit code
    let unique = false;
    let newCode = '';
    let obfuscated = '';

    while (!unique) {
      newCode = generate6DigitCode();
      obfuscated = obfuscateCode(newCode);
      
      const { data: existing } = await supabase
        .from('workspaces')
        .select('id')
        .eq('share_code', obfuscated)
        .maybeSingle();

      if (!existing) {
        unique = true;
      }
    }

    // Update workspace share code
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({ share_code: obfuscated })
      .eq('id', req.workspace_id);

    if (updateError) throw updateError;

    res.json({
      message: 'Share code regenerated successfully!',
      shareCode: newCode
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Remove User Member from Workspace
export const removeWorkspaceMember = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Safety check: verify owner authorization
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', req.workspace_id)
      .single();

    if (wsError) throw wsError;

    if (workspace.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the workspace owner is authorized to remove members.' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot remove yourself from your own workspace.' });
    }

    // Remove from workspace_members
    const { error: deleteError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', req.workspace_id)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Reset user's active workspace_id to NULL
    const { error: userError } = await supabase
      .from('users')
      .update({ workspace_id: null })
      .eq('id', userId);

    if (userError) throw userError;

    res.json({ message: 'Member successfully removed from workspace.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
