import React, { useState, useEffect, useContext } from 'react';
import { Store, User, Users, Shield, CreditCard, Bell, Download, Trash2, Check, X, ShieldAlert, Plus, Save, UserCheck, Clock, RefreshCw, UserPlus, Eye, EyeOff, Share2, Copy } from 'lucide-react';
import { ToastContext } from '../App';

// Sub-component: individual pending user approval card (needs own state for role select)
function ApprovalCard({ u, onApprove, onReject }) {
  const [assignedRole, setAssignedRole] = React.useState(u.role || 'cashier');
  const registeredAt = new Date(u.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '1.5rem',
      alignItems: 'center',
      padding: '1.25rem 1.5rem',
      borderRadius: 'var(--radius-md)',
      border: '1px solid #f59e0b44',
      backgroundColor: 'rgba(245,158,11,0.04)',
      boxShadow: '0 1px 6px rgba(0,0,0,0.05)'
    }}>
      {/* Left: user info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '1.1rem', flexShrink: 0
          }}>
            {(u.full_name || u.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {u.full_name || 'Unnamed User'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700' }}>
            ⏰ Requested: {registeredAt}
          </span>
          {u.phone && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {u.phone}</span>
          )}
        </div>
      </div>

      {/* Right: role selector + action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Assign Role</label>
          <select
            value={assignedRole}
            onChange={(e) => setAssignedRole(e.target.value)}
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="barista">Barista</option>
            <option value="cashier">Cashier</option>
            <option value="waiter">Waiter</option>
          </select>
        </div>

        <button
          onClick={() => onApprove(u.id, assignedRole)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem',
            background: '#10b981', color: 'white',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
          }}
        >
          ✓ Approve
        </button>

        <button
          onClick={() => onReject(u.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem',
            background: '#ef4444', color: 'white',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
          }}
        >
          ✕ Reject
        </button>
      </div>
    </div>
  );
}

const Settings = ({ userRole = 'admin', auth }) => {
  const { showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState('store');
  const [isLoading, setIsLoading] = useState(false);

  // Workspace & Sharing State
  const [workspaceInfo, setWorkspaceInfo] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [joinShareCode, setJoinShareCode] = useState('');
  const [loadingJoin, setLoadingJoin] = useState(false);

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!joinShareCode.trim() || joinShareCode.trim().length !== 6 || isNaN(joinShareCode)) {
      showToast('Please enter a valid 6-digit numeric share code', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to switch workspaces? You will leave your current workspace and join the new one.')) {
      return;
    }

    setLoadingJoin(true);
    try {
      const response = await fetch('/api/workspace/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ share_code: joinShareCode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join workspace');
      }

      showToast(`Successfully joined workspace "${data.workspace_name}"!`, 'success');

      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        const updatedUser = { 
          ...userInfo, 
          workspace_id: data.id, 
          workspace_name: data.workspace_name, 
          workspace_role: data.role 
        };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      }

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoadingJoin(false);
    }
  };

  const fetchWorkspaceInfo = async () => {
    setWorkspaceLoading(true);
    try {
      const res = await fetch('/api/workspace/info');
      if (res.ok) {
        const data = await res.json();
        setWorkspaceInfo(data);
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to fetch workspace info', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Network error fetching workspace info', 'error');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'workspace') {
      fetchWorkspaceInfo();
    }
  }, [activeTab]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast('Invitation code copied to clipboard!', 'success');
  };

  const handleWhatsAppShare = (code, name) => {
    const text = encodeURIComponent(`Hey! Join my CRFTD Coffee Shop workspace "${name}" using this 6-digit invitation code: ${code}. Get started here!`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Are you sure you want to regenerate the share invitation code? The old code will become invalid immediately!')) {
      return;
    }
    try {
      const res = await fetch('/api/workspace/regenerate-code', {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Share code regenerated successfully!', 'success');
        setWorkspaceInfo(prev => ({ ...prev, shareCode: data.shareCode }));
      } else {
        showToast(data.message || 'Failed to regenerate code', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleRemoveMember = async (memberId, memberName, isPending = false) => {
    const confirmMessage = isPending 
      ? `Are you sure you want to reject the request from "${memberName}" to join this workspace?`
      : `Are you sure you want to remove "${memberName}" from this workspace? They will be kicked and forced to select/join a workspace.`;
      
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const res = await fetch(`/api/workspace/members/${memberId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isPending ? 'Join request rejected.' : 'Member removed successfully', 'success');
        fetchWorkspaceInfo();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleApproveJoin = async (memberUserId, memberName) => {
    try {
      const res = await fetch('/api/workspace/members/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberUserId })
      });
      if (res.ok) {
        showToast(`Approved "${memberName}" to join the workspace!`, 'success');
        fetchWorkspaceInfo();
      } else {
        const err = await res.json();
        showToast(err.message || 'Approval failed', 'error');
      }
    } catch (error) {
      showToast('Error approving workspace request', 'error');
    }
  };

  // Store details state
  const [storeDetails, setStoreDetails] = useState(() => {
    const saved = localStorage.getItem('storeDetails');
    return saved ? JSON.parse(saved) : {
      name: 'CRFTD Coffee House',
      gstin: '27CRFTD0000A1Z5',
      address: 'Premium Crafted Experience, 123 Espresso Avenue',
      phone: '9876543210',
      email: 'contact@crftdcoffee.com',
      logoUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60'
    };
  });

  // GST configurations
  const [gstConfig, setGstConfig] = useState(() => {
    const saved = localStorage.getItem('gstConfig');
    return saved ? JSON.parse(saved) : {
      hot_coffee: 5,
      cold_coffee: 5,
      frappuccino: 5,
      soda: 12,
      light_bites: 12,
      savoury_bites: 12
    };
  });

  // Allowed discount percentages
  const [discountConfig, setDiscountConfig] = useState(() => {
    const saved = localStorage.getItem('discountConfig');
    return saved ? JSON.parse(saved) : [0, 5, 10, 15, 20];
  });
  const [discountInput, setDiscountInput] = useState(discountConfig.join(', '));

  // Notification configurations
  const [notificationConfig, setNotificationConfig] = useState(() => {
    const saved = localStorage.getItem('notificationConfig');
    return saved ? JSON.parse(saved) : {
      lowStockThreshold: 10,
      emailAlerts: true
    };
  });

  // Users state
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'cashier',
    phone: ''
  });
  const [directUserForm, setDirectUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'cashier',
    phone: ''
  });
  const [showDirectPassword, setShowDirectPassword] = useState(false);

  const getAuthToken = () => {
    const info = localStorage.getItem('userInfo');
    return info ? JSON.parse(info)?.token : '';
  };

  useEffect(() => {
    if (userRole !== 'admin') return;
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'approvals') fetchPendingUsers();
  }, [activeTab, userRole]);

  // Always load pending count for badge (runs on mount for admins)
  useEffect(() => {
    if (userRole === 'admin') fetchPendingUsers();
  }, [userRole]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to fetch users', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error fetching users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    setPendingLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/users/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data);
      }
    } catch (err) {
      // silent
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApproveUser = async (id, role = 'cashier') => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', is_active: true, role })
      });
      if (res.ok) {
        showToast('Access request approved! User can now log in.', 'success');
        fetchPendingUsers();
        fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.message || 'Approval failed', 'error');
      }
    } catch (err) {
      showToast('Error approving user', 'error');
    }
  };

  const handleRejectUser = async (id) => {
    if (!window.confirm('Reject this access request? The user will not be able to log in.')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (res.ok) {
        showToast('Access request rejected.', 'warning');
        fetchPendingUsers();
      } else {
        const err = await res.json();
        showToast(err.message || 'Rejection failed', 'error');
      }
    } catch (err) {
      showToast('Error rejecting user', 'error');
    }
  };

  // Form handlers
  const handleSaveStore = (e) => {
    e.preventDefault();
    localStorage.setItem('storeDetails', JSON.stringify(storeDetails));
    showToast('Store settings saved successfully!');
  };

  const handleSaveGst = (e) => {
    e.preventDefault();
    localStorage.setItem('gstConfig', JSON.stringify(gstConfig));
    showToast('GST tax configurations updated!');
  };

  const handleSaveDiscounts = (e) => {
    e.preventDefault();
    const parsed = discountInput
      .split(',')
      .map(v => parseInt(v.trim()))
      .filter(v => !isNaN(v) && v >= 0 && v <= 100);
    
    if (parsed.length === 0) {
      showToast('Please enter valid discount percentages!', 'error');
      return;
    }
    setDiscountConfig(parsed);
    localStorage.setItem('discountConfig', JSON.stringify(parsed));
    showToast('Allowed discount options updated!');
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem('notificationConfig', JSON.stringify(notificationConfig));
    showToast('Notification settings successfully updated!');
  };

  // User Actions
  const handleUpdateUserStatus = async (id, statusUpdates) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusUpdates)
      });
      if (res.ok) {
        showToast('Staff profile updated!');
        fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update user', 'error');
      }
    } catch (err) {
      showToast('Error updating staff member', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this staff member? This cannot be undone.')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('User account successfully deleted');
        fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showToast('Error deleting user account', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // 1. Register User (creates pending account)
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });
      
      const regData = await regRes.json();
      if (!regRes.ok) {
        showToast(regData.message || 'Failed to register staff', 'error');
        return;
      }

      // 2. Automatically approve user since it is created directly by Admin
      const token = getAuthToken();
      const approveRes = await fetch(`/api/users/${regData._id || regData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved', is_active: true })
      });

      if (approveRes.ok) {
        showToast('Staff member added and approved successfully!');
        setShowAddUserModal(false);
        setNewUserForm({ email: '', password: '', full_name: '', role: 'cashier', phone: '' });
        fetchUsers();
      } else {
        showToast('Staff registered but auto-approval failed. Please approve manually.', 'warning');
        setShowAddUserModal(false);
        fetchUsers();
      }
    } catch (err) {
      showToast('Error adding new staff member', 'error');
    }
  };

  const handleDirectCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const res = await fetch('/api/users/admin-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(directUserForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Team credentials created and approved successfully!', 'success');
        setDirectUserForm({
          full_name: '',
          email: '',
          password: '',
          phone: '',
          role: 'cashier'
        });
        fetchUsers();
      } else {
        showToast(data.message || 'Failed to create credentials', 'error');
      }
    } catch (err) {
      showToast('Error creating team credentials', 'error');
    }
  };

  // Consolidated Database Backup Download
  const handleExportBackup = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all core modules in parallel to bundle
      const [
        menuRes,
        invRes,
        supRes,
        custRes,
        ordRes,
        expRes,
        staffRes,
        wasteRes,
        feedRes
      ] = await Promise.all([
        fetch('/api/menu', { headers }),
        fetch('/api/inventory', { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/orders', { headers }),
        fetch('/api/expenses', { headers }),
        fetch('/api/staff', { headers }),
        fetch('/api/waste', { headers }),
        fetch('/api/feedback', { headers })
      ]);

      const backupObj = {
        exportedAt: new Date().toISOString(),
        exportedBy: userRole,
        storeDetails,
        gstConfig,
        discountConfig,
        notificationConfig,
        menu_items: menuRes.ok ? await menuRes.json() : [],
        raw_materials: invRes.ok ? await invRes.json() : [],
        suppliers: supRes.ok ? await supRes.json() : [],
        customers: custRes.ok ? await custRes.json() : [],
        orders: ordRes.ok ? await ordRes.json() : [],
        expenses: expRes.ok ? await expRes.json() : [],
        staff: staffRes.ok ? await staffRes.json() : [],
        waste_logs: wasteRes.ok ? await wasteRes.json() : [],
        feedback: feedRes.ok ? await feedRes.json() : []
      };

      // Trigger download
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `crftd_coffee_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Database backup JSON successfully compiled and downloaded!');
    } catch (err) {
      console.error(err);
      showToast('Error exporting data backup', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Configuration Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure core rules, store parameters, and team roles</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        {/* Settings Navigation */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1rem', height: 'fit-content' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('store')}
              className="btn hover-brighten" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'store' ? 'var(--primary)' : 'transparent', 
                color: activeTab === 'store' ? 'white' : 'var(--text-main)', 
                padding: '1rem' 
              }}
            >
              <Store size={18} /> Store Details
            </button>

            <button 
              onClick={() => setActiveTab('workspace')}
              className="btn hover-brighten" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'workspace' ? 'var(--primary)' : 'transparent', 
                color: activeTab === 'workspace' ? 'white' : 'var(--text-main)', 
                padding: '1rem' 
              }}
            >
              <Share2 size={18} /> Workspace & Sharing
            </button>

            {userRole === 'admin' && (
              <button 
                onClick={() => setActiveTab('users')}
                className="btn hover-brighten" 
                style={{ 
                  justifyContent: 'flex-start', 
                  background: activeTab === 'users' ? 'var(--primary)' : 'transparent', 
                  color: activeTab === 'users' ? 'white' : 'var(--text-main)', 
                  padding: '1rem' 
                }}
              >
                <User size={18} /> User Accounts
              </button>
            )}

            {userRole === 'admin' && (
              <button 
                onClick={() => setActiveTab('approvals')}
                className="btn hover-brighten" 
                style={{ 
                  justifyContent: 'flex-start', 
                  background: activeTab === 'approvals' ? 'var(--primary)' : 'transparent', 
                  color: activeTab === 'approvals' ? 'white' : 'var(--text-main)', 
                  padding: '1rem',
                  position: 'relative'
                }}
              >
                <UserCheck size={18} /> Access Requests
                {pendingUsers.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}>
                    {pendingUsers.length}
                  </span>
                )}
              </button>
            )}

            <button 
              onClick={() => setActiveTab('gst')}
              className="btn hover-brighten" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'gst' ? 'var(--primary)' : 'transparent', 
                color: activeTab === 'gst' ? 'white' : 'var(--text-main)', 
                padding: '1rem' 
              }}
            >
              <Shield size={18} /> GST Tax Rates
            </button>

            <button 
              onClick={() => setActiveTab('discounts')}
              className="btn hover-brighten" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'discounts' ? 'var(--primary)' : 'transparent', 
                color: activeTab === 'discounts' ? 'white' : 'var(--text-main)', 
                padding: '1rem' 
              }}
            >
              <CreditCard size={18} /> Discount Scales
            </button>

            <button 
              onClick={() => setActiveTab('notifications')}
              className="btn hover-brighten" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'notifications' ? 'var(--primary)' : 'transparent', 
                color: activeTab === 'notifications' ? 'white' : 'var(--text-main)', 
                padding: '1rem' 
              }}
            >
              <Bell size={18} /> Alert Thresholds
            </button>

            <button 
              onClick={() => setActiveTab('backup')}
              className="btn hover-brighten" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'backup' ? 'var(--primary)' : 'transparent', 
                color: activeTab === 'backup' ? 'white' : 'var(--text-main)', 
                padding: '1rem' 
              }}
            >
              <Download size={18} /> Data Backups
            </button>
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem', minHeight: '450px' }}>
          
          {/* 1. Store Details */}
          {activeTab === 'store' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={20} color="var(--primary)" /> Store Details
              </h2>
              
              <form onSubmit={handleSaveStore} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Store Name</label>
                    <input 
                      type="text" 
                      value={storeDetails.name} 
                      onChange={(e) => setStoreDetails({...storeDetails, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>GSTIN (Tax ID)</label>
                    <input 
                      type="text" 
                      value={storeDetails.gstin} 
                      onChange={(e) => setStoreDetails({...storeDetails, gstin: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Phone Number</label>
                    <input 
                      type="text" 
                      value={storeDetails.phone} 
                      onChange={(e) => setStoreDetails({...storeDetails, phone: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={storeDetails.email} 
                      onChange={(e) => setStoreDetails({...storeDetails, email: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Store Address</label>
                  <textarea 
                    rows="3" 
                    value={storeDetails.address} 
                    onChange={(e) => setStoreDetails({...storeDetails, address: e.target.value})} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Logo Image URL</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={storeDetails.logoUrl} 
                      onChange={(e) => setStoreDetails({...storeDetails, logoUrl: e.target.value})} 
                      placeholder="https://example.com/logo.png" 
                      style={{ flex: 1 }}
                    />
                    {storeDetails.logoUrl && (
                      <img 
                        src={storeDetails.logoUrl} 
                        alt="Logo Preview" 
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                        onError={(e) => e.target.src = 'https://placehold.co/48x48?text=Logo'}
                      />
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={18} /> Save Details
                </button>
              </form>

              {userRole === 'admin' && (
                <div style={{ marginTop: '3rem', paddingTop: '2.5rem', borderTop: '1px solid var(--border)' }}>
                  <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus size={20} color="var(--primary)" /> Add Team Credentials (Staff, Founder, Manager)
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Directly register and auto-approve a new staff member, founder, or manager, bypassing the standard public access request approval queues.
                  </p>
                  
                  <form onSubmit={handleDirectCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Daksh Maru"
                          value={directUserForm.full_name} 
                          onChange={(e) => setDirectUserForm({...directUserForm, full_name: e.target.value})} 
                          required 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email Address</label>
                        <input 
                          type="email" 
                          placeholder="e.g. staff@coffee.com"
                          value={directUserForm.email} 
                          onChange={(e) => setDirectUserForm({...directUserForm, email: e.target.value})} 
                          required 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type={showDirectPassword ? "text" : "password"} 
                            placeholder="Password credentials"
                            value={directUserForm.password} 
                            onChange={(e) => setDirectUserForm({...directUserForm, password: e.target.value})} 
                            style={{ width: '100%', paddingRight: '2.5rem' }}
                            required 
                          />
                          <button
                            type="button"
                            onClick={() => setShowDirectPassword(!showDirectPassword)}
                            style={{
                              position: 'absolute',
                              right: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)'
                            }}
                          >
                            {showDirectPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Phone Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 9876543210"
                          value={directUserForm.phone} 
                          onChange={(e) => setDirectUserForm({...directUserForm, phone: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>System Role</label>
                        <select 
                          value={directUserForm.role}
                          onChange={(e) => setDirectUserForm({...directUserForm, role: e.target.value})}
                          required
                        >
                          <option value="admin">Admin (Full Access & Settings)</option>
                          <option value="manager">Manager (Inventory, Staff & Supplies)</option>
                          <option value="barista">Barista (POS, Orders & Recipes)</option>
                          <option value="cashier">Cashier (POS & Billing Only)</option>
                          <option value="waiter">Waiter (Order Servings)</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserPlus size={18} /> Create & Approve Credentials
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Workspace & Sharing Settings */}
          {activeTab === 'workspace' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Share2 size={24} style={{ color: 'var(--primary)' }} /> Workspace & Sharing
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Manage store properties, invite cashiers and managers, and track workspace access controls.
                  </p>
                </div>
                <button onClick={fetchWorkspaceInfo} disabled={workspaceLoading} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <RefreshCw size={14} className={workspaceLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {workspaceLoading && !workspaceInfo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', gap: '1rem' }}>
                  <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading workspace profiles...</p>
                </div>
              ) : workspaceInfo ? (
                <>
                  {/* Share Box & Info Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
                    
                    {/* Share Invitation Code Styled Box */}
                    <div className="glass" style={{
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #ffffff 0%, rgba(140, 98, 57, 0.03) 100%)',
                      padding: '2rem',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>STORE SEGMENT</span>
                        <h4 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.25rem' }}>{workspaceInfo.name}</h4>
                      </div>

                      {workspaceInfo.isOwner ? (
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>6-DIGIT WORKSPACE INVITATION CODE</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{
                              fontSize: '2rem',
                              fontWeight: 900,
                              color: 'var(--primary)',
                              backgroundColor: 'rgba(140, 98, 57, 0.08)',
                              padding: '0.5rem 2rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1.5px dashed var(--primary)',
                              letterSpacing: '0.15em',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: 'var(--shadow-sm)'
                            }}>
                              {workspaceInfo.shareCode}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleCopyCode(workspaceInfo.shareCode)} className="btn btn-secondary" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }} title="Copy Code to Clipboard">
                                <Copy size={16} /> Copy
                              </button>
                              
                              <button onClick={() => handleWhatsAppShare(workspaceInfo.shareCode, workspaceInfo.name)} className="btn" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', backgroundColor: '#25D366', color: 'white', border: 'none' }} title="Share via WhatsApp">
                                <svg size={16} viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.013-5.035-2.855-6.882-1.843-1.848-4.293-2.865-6.887-2.865-5.448 0-9.873 4.37-9.876 9.732-.001 1.765.485 3.49 1.408 5.013l-.995 3.637 3.737-.981zm12.39-6.236c-.3-.15-1.77-.875-2.04-.975-.27-.1-.47-.15-.67.15-.2.3-.77.975-.94 1.175-.17.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.67-1.625-.92-2.225-.244-.589-.48-.51-.67-.52l-.57-.01c-.2 0-.52.075-.79.375-.27.3-1.04 1.02-1.04 2.487s1.07 2.87 1.22 3.075c.15.2 2.11 3.22 5.11 4.52.714.31 1.27.496 1.703.635.717.227 1.368.195 1.883.118.574-.085 1.77-.725 2.02-1.39.25-.665.25-1.235.175-1.39-.075-.155-.275-.255-.575-.405z"/></svg> WhatsApp
                              </button>
                            </div>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem', lineHeight: '1.4' }}>
                            Give this 6-digit invitation code to other team members. Once they enter this code during signup, they will automatically join this workspace and see the exact same POS menu, ledger, and staff reports.
                          </p>
                        </div>
                      ) : (
                        <div style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(140, 98, 57, 0.05)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: 'var(--primary)',
                          fontSize: '0.85rem',
                          fontWeight: '700'
                        }}>
                          <Users size={16} /> Only the workspace owner has permission to view or regenerate invitation codes.
                        </div>
                      )}
                      
                    </div>

                    {/* Meta Action Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Active Workspace</h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You are currently connected to this workspace as a <strong>{workspaceInfo.isOwner ? 'Owner' : 'Staff Member'}</strong>.</p>
                      </div>

                      {/* Join Workspace Options */}
                      <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.15rem' }}>Join Workspace</h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          Enter a 6-digit share code to switch to a different workspace.
                        </p>
                        <form onSubmit={handleJoinWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                          <input 
                            type="text" 
                            required
                            maxLength={6}
                            placeholder="e.g. 123456" 
                            value={joinShareCode}
                            onChange={(e) => setJoinShareCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.6)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.5rem 0.75rem',
                              fontSize: '1rem',
                              textAlign: 'center',
                              letterSpacing: '0.2em',
                              fontWeight: 'bold',
                              color: 'var(--primary)',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          />
                          <button 
                            type="submit" 
                            disabled={loadingJoin}
                            className="btn btn-primary"
                            style={{
                              width: '100%',
                              padding: '0.6rem',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              cursor: 'pointer',
                              border: 'none',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {loadingJoin ? 'Joining...' : 'Switch Workspace'}
                          </button>
                        </form>
                      </div>

                      {workspaceInfo.isOwner && (
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #f59e0b22', backgroundColor: 'rgba(245,158,11,0.03)' }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#f59e0b', marginBottom: '0.25rem' }}>Danger Zone</h5>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Invalidate old code and generate a new one.</p>
                          <button onClick={handleRegenerateCode} className="btn" style={{
                            padding: '0.6rem 1rem',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            border: '1px solid #f59e0b',
                            background: 'transparent',
                            color: '#f59e0b',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <RefreshCw size={14} /> Regenerate Code
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Pending Join Requests Section */}
                  {workspaceInfo.isOwner && workspaceInfo.members.filter(m => m.status === 'pending').length > 0 && (
                    <div style={{ marginTop: '2rem', border: '1px solid #f59e0b44', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: 'rgba(245,158,11,0.03)' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⏳ Pending Join Requests ({workspaceInfo.members.filter(m => m.status === 'pending').length})
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        The following users entered your 6-digit workspace code and are requesting access to this store.
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {workspaceInfo.members.filter(m => m.status === 'pending').map(m => (
                          <div key={m.userId} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1.25rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{m.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.email}</div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleApproveJoin(m.userId, m.name)}
                                className="btn"
                                style={{
                                  padding: '0.4rem 0.85rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer'
                                }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleRemoveMember(m.userId, m.name, true)}
                                className="btn"
                                style={{
                                  padding: '0.4rem 0.85rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members List Section */}
                  <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem' }}>
                      Workspace Members ({workspaceInfo.members.filter(m => m.status !== 'pending').length})
                    </h4>
                    
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(140, 98, 57, 0.03)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>Name</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>Email</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>Role</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>Joined At</th>
                            {workspaceInfo.isOwner && (
                              <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {workspaceInfo.members.filter(m => m.status !== 'pending').map(m => (
                            <tr key={m.userId} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }} className="hover-brighten">
                              <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                {m.name} {auth && m.userId === auth._id && <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(140,98,57,0.15)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: '800' }}>YOU</span>}
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{m.email}</td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: '800',
                                  textTransform: 'uppercase',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '30px',
                                  backgroundColor: m.role === 'owner' ? 'rgba(140, 98, 57, 0.15)' : 'rgba(100, 100, 100, 0.1)',
                                  color: m.role === 'owner' ? 'var(--primary)' : 'var(--text-muted)'
                                }}>
                                  {m.role}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                {new Date(m.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              {workspaceInfo.isOwner && (
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                  {auth && m.userId !== auth._id ? (
                                    <button onClick={() => handleRemoveMember(m.userId, m.name)} className="btn" style={{
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      color: '#d9534f',
                                      border: '1px solid #d9534f',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      borderRadius: 'var(--radius-sm)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}>
                                      <Trash2 size={12} /> Remove
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Owner</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                          {workspaceInfo.members.filter(m => m.status !== 'pending').length === 0 && (
                            <tr>
                              <td colSpan={workspaceInfo.isOwner ? 5 : 4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No active members in this workspace.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}

            </div>
          )}

          {/* 2. User Accounts Management (Admin only) */}
          {activeTab === 'users' && userRole === 'admin' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={20} color="var(--primary)" /> Staff & User Accounts
                </h2>
                <button 
                  onClick={() => setShowAddUserModal(true)}
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
                >
                  <Plus size={16} /> Add Staff Member
                </button>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="skeleton" style={{ height: '30px', marginBottom: '1rem' }}></div>
                  <div className="skeleton" style={{ height: '30px', marginBottom: '1rem' }}></div>
                  <div className="skeleton" style={{ height: '30px' }}></div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Name</th>
                        <th style={{ padding: '0.75rem' }}>Email / Phone</th>
                        <th style={{ padding: '0.75rem' }}>Role</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.full_name || 'No Name'}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <div>{u.email}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.phone || 'No phone'}</div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <select 
                              value={u.role}
                              onChange={(e) => handleUpdateUserStatus(u.id, { role: e.target.value })}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="barista">Barista</option>
                              <option value="cashier">Cashier</option>
                              <option value="waiter">Waiter</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {u.status === 'pending' ? (
                              <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                Pending
                              </span>
                            ) : u.status === 'rejected' ? (
                              <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                Rejected
                              </span>
                            ) : (
                              <span style={{ color: u.is_active ? '#10b981' : '#6b7280', background: u.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {u.is_active ? 'Active' : 'Suspended'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              {u.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateUserStatus(u.id, { status: 'approved', is_active: true })}
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.25rem 0.5rem', background: '#10b981', color: 'white', border: 'none' }}
                                    title="Approve"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateUserStatus(u.id, { status: 'rejected' })}
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none' }}
                                    title="Reject"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}
                              {u.status === 'approved' && (
                                <button 
                                  onClick={() => handleUpdateUserStatus(u.id, { is_active: !u.is_active })}
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                >
                                  {u.is_active ? 'Suspend' : 'Activate'}
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem 0.5rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No users registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2b. Access Approvals Panel (Admin only) */}
          {activeTab === 'approvals' && userRole === 'admin' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={20} color="var(--primary)" /> Access Requests
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Review and action staff registration requests
                  </p>
                </div>
                <button
                  onClick={fetchPendingUsers}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {pendingLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-md)' }} />)}
                </div>
              ) : pendingUsers.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '4rem 2rem', textAlign: 'center',
                  border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)'
                }}>
                  <UserCheck size={48} color="#10b981" style={{ marginBottom: '1rem', opacity: 0.6 }} />
                  <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>All Clear!</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pending access requests right now.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingUsers.map(u => (
                    <ApprovalCard
                      key={u.id}
                      u={u}
                      onApprove={handleApproveUser}
                      onReject={handleRejectUser}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. GST Configurations */}
          {activeTab === 'gst' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="var(--primary)" /> Default Category GST Rates
              </h2>
              
              <form onSubmit={handleSaveGst} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure the default GST percentage charged for menu products in each category:</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Hot Coffee (%)</label>
                    <input 
                      type="number" 
                      value={gstConfig.hot_coffee} 
                      onChange={(e) => setGstConfig({...gstConfig, hot_coffee: parseFloat(e.target.value)})} 
                      min="0" max="100" required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cold Coffee (%)</label>
                    <input 
                      type="number" 
                      value={gstConfig.cold_coffee} 
                      onChange={(e) => setGstConfig({...gstConfig, cold_coffee: parseFloat(e.target.value)})} 
                      min="0" max="100" required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Frappuccino (%)</label>
                    <input 
                      type="number" 
                      value={gstConfig.frappuccino} 
                      onChange={(e) => setGstConfig({...gstConfig, frappuccino: parseFloat(e.target.value)})} 
                      min="0" max="100" required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Soda / Soft drinks (%)</label>
                    <input 
                      type="number" 
                      value={gstConfig.soda} 
                      onChange={(e) => setGstConfig({...gstConfig, soda: parseFloat(e.target.value)})} 
                      min="0" max="100" required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Light Bites (%)</label>
                    <input 
                      type="number" 
                      value={gstConfig.light_bites} 
                      onChange={(e) => setGstConfig({...gstConfig, light_bites: parseFloat(e.target.value)})} 
                      min="0" max="100" required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Savoury Bites (%)</label>
                    <input 
                      type="number" 
                      value={gstConfig.savoury_bites} 
                      onChange={(e) => setGstConfig({...gstConfig, savoury_bites: parseFloat(e.target.value)})} 
                      min="0" max="100" required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={18} /> Save Tax Configurations
                </button>
              </form>
            </div>
          )}

          {/* 4. Discount Settings */}
          {activeTab === 'discounts' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="var(--primary)" /> POS Discount Options
              </h2>
              
              <form onSubmit={handleSaveDiscounts} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Allowed Discounts (Comma-separated percentages)</label>
                  <input 
                    type="text" 
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="0, 5, 10, 15, 20" 
                    required
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    These percentages will appear in the checkout discount dropdown on the POS order page.
                  </small>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={18} /> Save Discount Scales
                </button>
              </form>
            </div>
          )}

          {/* 5. Notification & Alert Settings */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="var(--primary)" /> Alert Thresholds
              </h2>
              
              <form onSubmit={handleSaveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Default Global Low-Stock Threshold</label>
                  <input 
                    type="number" 
                    value={notificationConfig.lowStockThreshold} 
                    onChange={(e) => setNotificationConfig({...notificationConfig, lowStockThreshold: parseInt(e.target.value)})}
                    min="1" required 
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    Sets the default threshold level for raw materials before a "Low Stock Alert" gets triggered.
                  </small>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="emailAlerts"
                    checked={notificationConfig.emailAlerts} 
                    onChange={(e) => setNotificationConfig({...notificationConfig, emailAlerts: e.target.checked})} 
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <label htmlFor="emailAlerts" style={{ cursor: 'pointer', fontWeight: 500 }}>Enable Real-time low stock dashboard warning sounds & banners</label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={18} /> Save Alert Settings
                </button>
              </form>
            </div>
          )}

          {/* 6. Database Backups */}
          {activeTab === 'backup' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={20} color="var(--primary)" /> Database & Parameter Backups
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Export the entire Supabase database including Menu Items, Recipes, Raw Materials stock levels, Suppliers, Expense ledgers, active orders, and customer ratings into a single downloadable JSON backup file. This backup can be archived and referenced at any time.
                </p>

                <div style={{ background: 'rgba(140, 98, 57, 0.08)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <ShieldAlert size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Strict Role Security Access</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Database downloads contain customer names, phone registers, and core operational expenses. Only users registered with <strong>Admin</strong> or <strong>Manager</strong> credentials may perform complete exports.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleExportBackup}
                  disabled={isLoading}
                  className="btn btn-primary" 
                  style={{ alignSelf: 'flex-start', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                >
                  {isLoading ? 'Compiling Backup...' : <>
                    <Download size={18} /> Export Full JSON Backup
                  </>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddUserModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass animate-slide-up" style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Add New Staff Member</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Email Address</label>
                <input 
                  type="email" 
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Password</label>
                <input 
                  type="password" 
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Phone Number</label>
                <input 
                  type="text" 
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Role</label>
                <select 
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="barista">Barista</option>
                  <option value="cashier">Cashier</option>
                  <option value="waiter">Waiter</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddUserModal(false)}
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Create & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
