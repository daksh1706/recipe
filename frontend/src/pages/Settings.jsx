import React, { useState, useEffect, useContext } from 'react';
import { Store, User, Shield, CreditCard, Bell, Download, Trash2, Check, X, ShieldAlert, Plus, Save, UserCheck, Clock, RefreshCw } from 'lucide-react';
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

const Settings = ({ userRole = 'admin' }) => {
  const { showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState('store');
  const [isLoading, setIsLoading] = useState(false);

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
