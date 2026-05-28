import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext, ToastContext } from '../App';
import { 
  ShoppingCart, 
  Package, 
  MenuSquare, 
  BarChart3, 
  Settings as SettingsIcon,
  BookOpen,
  Bell,
  LogOut,
  Coffee,
  Users,
  Compass,
  DollarSign,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Sun,
  Moon,
  ChevronRight,
  Check,
  X,
  Edit2
} from 'lucide-react';

const Sidebar = ({ setAuth, role, auth, handleLogout }) => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { showToast } = React.useContext(ToastContext);

  const [workspaceName, setWorkspaceName] = React.useState(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      if (userInfo.workspace_name) {
        return userInfo.workspace_name;
      }
    }
    return 'CRFTD COFFEE';
  });

  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(workspaceName);
  const [isHovered, setIsHovered] = React.useState(false);

  // Sync editValue when workspaceName updates externally
  React.useEffect(() => {
    setEditValue(workspaceName);
  }, [workspaceName]);

  // Synchronize document title to match the workspace name
  React.useEffect(() => {
    if (workspaceName) {
      document.title = `${workspaceName} | POS & Management`;
    }
  }, [workspaceName]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setEditValue(workspaceName);
      setIsEditing(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!editValue.trim()) {
      showToast?.('Workspace name cannot be empty', 'error');
      return;
    }
    try {
      const res = await fetch('/api/workspace/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify({ workspace_name: editValue.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.('Workspace renamed successfully!', 'success');
        setWorkspaceName(data.workspace_name);
        setIsEditing(false);

        // Update auth/user info in localStorage so other modules pick it up
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          userInfo.workspace_name = data.workspace_name;
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }

        // Fire event so that Settings page or other pages can sync
        window.dispatchEvent(new Event('workspace_renamed'));
      } else {
        showToast?.(data.message || 'Failed to rename workspace', 'error');
      }
    } catch (err) {
      showToast?.('Error renaming workspace', 'error');
    }
  };

  React.useEffect(() => {
    if (!auth || !auth.token || !auth.workspace_id) return;

    const fetchWS = async () => {
      try {
        const res = await fetch('/api/workspace/info', {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.name) {
            setWorkspaceName(data.name);
          }
        }
      } catch (err) {
        // silent
      }
    };

    fetchWS();

    const handleRename = () => {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo.workspace_name) {
          setWorkspaceName(userInfo.workspace_name);
          return;
        }
      }
      fetchWS();
    };

    window.addEventListener('workspace_renamed', handleRename);
    return () => window.removeEventListener('workspace_renamed', handleRename);
  }, [auth?.workspace_id, auth?.token]);

  const userRole = (role || auth?.role || '').toLowerCase();

  // Helper to determine if a route is allowed for the user
  const canAccess = (allowedRoles) => {
    return allowedRoles.includes(userRole);
  };

  const menuItems = [
    { to: '/dashboard', icon: <Compass size={18} />, label: 'Dashboard', roles: ['admin', 'manager'] },
    { to: '/pos', icon: <ShoppingCart size={18} />, label: 'Point of Sale (POS)', roles: ['admin', 'manager', 'barista', 'cashier'] },
    { to: '/orders', icon: <Bell size={18} />, label: 'Active Orders', roles: ['admin', 'manager', 'barista', 'cashier'] },
    { to: '/menu', icon: <MenuSquare size={18} />, label: 'Menu Items', roles: ['admin', 'manager'] },
    { to: '/recipes', icon: <Coffee size={18} />, label: 'Recipes Studio', roles: ['admin', 'manager', 'barista'] },
    { to: '/inventory', icon: <Package size={18} />, label: 'Inventory Stock', roles: ['admin', 'manager', 'barista'] },
    { to: '/suppliers', icon: <Users size={18} />, label: 'Supplier Hub', roles: ['admin', 'manager'] },
    { to: '/customers', icon: <Users size={18} />, label: 'Customers directory', roles: ['admin', 'manager', 'cashier'] },
    { to: '/ledger', icon: <BookOpen size={18} />, label: 'Order Ledger', roles: ['admin', 'manager', 'cashier'] },
    { to: '/expenses', icon: <DollarSign size={18} />, label: 'Expenses Tracker', roles: ['admin', 'manager'] },
    { to: '/reports', icon: <BarChart3 size={18} />, label: 'Financial Reports', roles: ['admin'] },
    { to: '/staff', icon: <Calendar size={18} />, label: 'Staff & Roster', roles: ['admin', 'manager'] },
    { to: '/waste', icon: <AlertTriangle size={18} />, label: 'Spoilage Waste Log', roles: ['admin', 'manager', 'barista'] },
    { to: '/feedback', icon: <MessageSquare size={18} />, label: 'Reviews Feedback', roles: ['admin', 'manager'] },
    { to: '/settings', icon: <SettingsIcon size={18} />, label: 'Configuration', roles: ['admin', 'manager'] }
  ];

  return (
    <>
      <div className="desktop-sidebar" style={{
        width: '280px',
        backgroundColor: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0
      }}>
        {/* Logo and Shop Header */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              color: 'white'
            }}>
              <Coffee size={20} />
            </div>
            <div 
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{ display: 'flex', flexDirection: 'column', minWidth: '150px', position: 'relative' }}
            >
              {isEditing ? (
                <form onSubmit={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0, width: '100%' }}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      backgroundColor: 'var(--border-light)',
                      border: '2px solid var(--primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 4px',
                      width: '120px',
                      outline: 'none',
                      textTransform: 'uppercase',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '2px', display: 'flex', alignItems: 'center' }} title="Save">
                    <Check size={16} />
                  </button>
                  <button type="button" onClick={() => { setEditValue(workspaceName); setIsEditing(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d9534f', padding: '2px', display: 'flex', alignItems: 'center' }} title="Cancel">
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 
                    style={{ 
                      fontSize: '1.1rem', 
                      margin: 0, 
                      fontWeight: 800, 
                      color: 'var(--text-main)', 
                      letterSpacing: '0.5px', 
                      textTransform: 'uppercase',
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={workspaceName}
                  >
                    {workspaceName}
                  </h2>
                  <button 
                    onClick={() => {
                      setEditValue(workspaceName);
                      setIsEditing(true);
                    }} 
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      opacity: isHovered ? 0.7 : 0,
                      padding: '2px',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Rename Workspace"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginTop: '2px' }}>Management Console</span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Menu List */}
        <nav style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.25rem', 
          flex: 1, 
          overflowY: 'auto',
          padding: '1rem 0.75rem' 
        }}>
          {menuItems.map((item, idx) => {
            if (!canAccess(item.roles)) return null;
            return (
              <NavLink
                key={idx}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '0.9rem',
                  transition: 'var(--transition)'
                })}
                className={({ isActive }) => isActive ? '' : 'hover-brighten'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.6 }} />
              </NavLink>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div style={{ 
          borderTop: '1px solid var(--border)', 
          padding: '1.25rem', 
          backgroundColor: 'var(--border-light)',
          flexShrink: 0
        }}>
          {/* User Account Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: '800', 
                color: 'var(--text-main)', 
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={auth?.email || 'dakshmaru10@gmail.com'}>
                {auth?.full_name || auth?.email?.split('@')[0] || 'User'}
              </span>
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: '700',
                textTransform: 'uppercase',
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                width: 'fit-content'
              }}>
                {userRole}
              </span>
            </div>
            
            <button 
              onClick={handleLogout} 
              style={{ 
                background: 'rgba(217, 83, 79, 0.1)', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '0.5rem', 
                borderRadius: 'var(--radius-sm)',
                color: '#d9534f',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Logout Account"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Gated for responsive visibility) */}
      <div className="mobile-bottom-nav">
        <MobileNavItem to="/pos" icon={<ShoppingCart size={20} />} label="POS" />
        <MobileNavItem to="/orders" icon={<Bell size={20} />} label="Orders" />
        {canAccess(['admin', 'manager']) && (
          <MobileNavItem to="/dashboard" icon={<Compass size={20} />} label="Stats" />
        )}
        {canAccess(['admin', 'manager', 'barista']) && (
          <MobileNavItem to="/inventory" icon={<Package size={20} />} label="Stock" />
        )}
        <MobileNavItem to="/settings" icon={<SettingsIcon size={20} />} label="Set" />
      </div>
    </>
  );
};

const MobileNavItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.2rem',
        textDecoration: 'none',
        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
        fontWeight: isActive ? '700' : '600',
        transition: 'var(--transition)',
        padding: '0.25rem'
      })}
    >
      {icon}
      <span style={{ fontSize: '0.65rem' }}>{label}</span>
    </NavLink>
  );
};

export default Sidebar;
