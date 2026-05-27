import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../App';
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
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ setAuth, role, auth, handleLogout }) => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

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
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.5px' }}>CRFTD COFFEE</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Management Console</span>
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

        {/* Theme and Profile Footer */}
        <div style={{ 
          borderTop: '1px solid var(--border)', 
          padding: '1.25rem', 
          backgroundColor: 'var(--border-light)',
          flexShrink: 0
        }}>
          {/* Theme Mode Toggle Button */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px dashed var(--border)'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>Theme Mode</span>
            <button 
              onClick={toggleTheme} 
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '30px',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: '700',
                boxShadow: 'var(--shadow-sm)',
                transition: 'var(--transition)'
              }}
            >
              {darkMode ? (
                <>
                  <Sun size={14} color="#f0ad4e" /> Light
                </>
              ) : (
                <>
                  <Moon size={14} color="#8C6239" /> Dark
                </>
              )}
            </button>
          </div>

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
