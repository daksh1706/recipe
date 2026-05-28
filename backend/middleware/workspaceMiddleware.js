import { supabase } from '../config/supabase.js';

export const workspaceProtect = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized, no user session' });
    }

    // Query users table to get the active workspace_id
    const { data: user, error } = await supabase
      .from('users')
      .select('workspace_id, role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ message: 'Not authorized, user profile not found' });
    }

    if (!user.workspace_id) {
      // Allow user info, logout, and workspace creation/joining endpoints to bypass workspace check
      const path = req.baseUrl + req.path;
      if (path.startsWith('/api/workspace') || path.startsWith('/api/auth/me') || path.startsWith('/api/users/admin-create')) {
        return next();
      }
      
      return res.status(403).json({ 
        message: 'Workspace Selection Required', 
        noWorkspace: true 
      });
    }

    req.workspace_id = user.workspace_id;
    req.user.role = user.role; // sync latest role
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
