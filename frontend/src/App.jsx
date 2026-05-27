import React, { useState, useEffect, createContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import MenuManager from './pages/MenuManager';
import RecipeManager from './pages/RecipeManager';
import InventoryDashboard from './pages/InventoryDashboard';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import OrderLedger from './pages/OrderLedger';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import StaffManager from './pages/StaffManager';
import WasteLog from './pages/WasteLog';
import Feedback from './pages/Feedback';
import Settings from './pages/Settings';
import ActiveOrders from './pages/ActiveOrders';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';
import { ShieldAlert, Info } from 'lucide-react';

// 1. Toast Notification Context
export const ToastContext = createContext({
  showToast: (message, type) => {}
});

// 2. Theme Context
export const ThemeContext = createContext({
  darkMode: false,
  toggleTheme: () => {}
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', color: '#ef4444', backgroundColor: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={48} style={{ marginBottom: '1rem' }} />
          <h1 style={{ marginBottom: '1rem' }}>App level error occurred</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The layout encountered a crash. We apologize for the inconvenience.</p>
          <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '8px', maxWidth: '600px', overflowX: 'auto', fontSize: '0.85rem' }}>
            {this.state.error ? this.state.error.toString() : ''}
          </pre>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '2rem' }}>Reload App</button>
        </div>
      );
    }
    return this.props.children; 
  }
}

// Access Denied component for gated roles
function AccessDenied() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }}>
      <ShieldAlert size={64} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Access Denied</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '450px', marginBottom: '2rem' }}>
        Your account role does not have authorization to view this management module. Please contact the Admin if you require access.
      </p>
      <Navigate to="/pos" replace />
    </div>
  );
}

function AppInner() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  });

  const [darkMode, setDarkMode] = useState(false);

  const [toast, setToast] = useState(null);

  // Enforce Light Theme Mode strictly
  useEffect(() => {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }, []);

  const toggleTheme = useCallback(() => {}, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Auth logout helper
  const handleLogout = useCallback(() => {
    localStorage.removeItem('userInfo');
    setAuth(null);
  }, []);

  if (!auth) {
    return (
      <ToastContext.Provider value={{ showToast }}>
        <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
          <BrowserRouter>
            <Routes>
              <Route path="*" element={<AuthPage setAuth={setAuth} />} />
            </Routes>
          </BrowserRouter>
          {toast && (
            <div className="animate-slide-up" style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              backgroundColor: toast.type === 'success' ? '#8C6239' : (toast.type === 'error' ? '#d9534f' : '#f0ad4e'),
              boxShadow: 'var(--shadow-lg)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontWeight: '600',
              borderLeft: '5px solid rgba(255,255,255,0.4)',
              fontSize: '0.95rem'
            }}>
              <Info size={18} />
              <span>{toast.message}</span>
            </div>
          )}
        </ThemeContext.Provider>
      </ToastContext.Provider>
    );
  }

  // Define Gated Route Protection Guards based on role
  const userRole = (auth.role || '').toLowerCase(); // admin, manager, barista, cashier, waiter

  const isRole = (allowed) => {
    return allowed.includes(userRole);
  };

  const GuardRoute = ({ allowed, element }) => {
    return isRole(allowed) ? element : <AccessDenied />;
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
        <BrowserRouter>
          <div className="app-container">
            <Sidebar setAuth={setAuth} role={auth.role} auth={auth} handleLogout={handleLogout} />
            <main className="main-content">
              <Routes>
                {/* Redirect home to POS or Dashboard depending on role */}
                <Route path="/" element={<Navigate to={userRole === 'barista' ? '/orders' : '/dashboard'} replace />} />

                {/* Dashboard (Module 1): admin, manager */}
                <Route path="/dashboard" element={
                  <GuardRoute allowed={['admin', 'manager']} element={<Dashboard />} />
                } />

                {/* POS / Order Entry (Module 4): admin, manager, barista, cashier */}
                <Route path="/pos" element={
                  <GuardRoute allowed={['admin', 'manager', 'barista', 'cashier']} element={<POS auth={auth} />} />
                } />

                {/* Menu Manager (Module 2): admin, manager */}
                <Route path="/menu" element={
                  <GuardRoute allowed={['admin', 'manager']} element={<MenuManager />} />
                } />

                {/* Recipe Studio (Module 3): admin, manager, barista */}
                <Route path="/recipes" element={
                  <GuardRoute allowed={['admin', 'manager', 'barista']} element={<RecipeManager />} />
                } />

                {/* Inventory Stock Dashboard (Module 8): admin, manager, barista */}
                <Route path="/inventory" element={
                  <GuardRoute allowed={['admin', 'manager', 'barista']} element={<InventoryDashboard userRole={userRole} />} />
                } />

                {/* Supplier Hub (Module 9): admin, manager */}
                <Route path="/suppliers" element={
                  <GuardRoute allowed={['admin', 'manager']} element={<Suppliers />} />
                } />

                {/* Customers loyalty profile (Module 7): admin, manager, cashier */}
                <Route path="/customers" element={
                  <GuardRoute allowed={['admin', 'manager', 'cashier']} element={<Customers />} />
                } />

                {/* Order Ledger (Module 6): admin, manager, cashier */}
                <Route path="/ledger" element={
                  <GuardRoute allowed={['admin', 'manager', 'cashier']} element={<OrderLedger />} />
                } />

                {/* Active orders monitor: admin, manager, barista, cashier */}
                <Route path="/orders" element={
                  <GuardRoute allowed={['admin', 'manager', 'barista', 'cashier']} element={<ActiveOrders />} />
                } />

                {/* Outflow expenses tracker (Module 10): admin, manager */}
                <Route path="/expenses" element={
                  <GuardRoute allowed={['admin', 'manager']} element={<Expenses />} />
                } />

                {/* Income & Profit Reports (Module 11): admin only */}
                <Route path="/reports" element={
                  <GuardRoute allowed={['admin']} element={<Reports />} />
                } />

                {/* Roster & Staff Calendar (Module 12): admin, manager */}
                <Route path="/staff" element={
                  <GuardRoute allowed={['admin', 'manager']} element={<StaffManager />} />
                } />

                {/* Waste Spoilage logs (Module 13): admin, manager, barista */}
                <Route path="/waste" element={
                  <GuardRoute allowed={['admin', 'manager', 'barista']} element={<WasteLog />} />
                } />

                {/* Customer Reviews Feedback (Module 14): admin, manager */}
                <Route path="/feedback" element={
                  <GuardRoute allowed={['admin', 'manager']} element={<Feedback />} />
                } />

                {/* Configuration Settings (Module 15): admin, manager */}
                <Route path="/settings" element={
                  <GuardRoute allowed={['admin', 'manager']} element={<Settings userRole={userRole} />} />
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>

        {/* Global Toast Panel */}
        {toast && (
          <div className="animate-slide-up" style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            backgroundColor: toast.type === 'success' ? '#8C6239' : (toast.type === 'error' ? '#d9534f' : '#f0ad4e'),
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: '600',
            borderLeft: '5px solid rgba(255,255,255,0.4)',
            fontSize: '0.95rem'
          }}>
            <Info size={18} />
            <span>{toast.message}</span>
          </div>
        )}
      </ThemeContext.Provider>
    </ToastContext.Provider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

export default App;
