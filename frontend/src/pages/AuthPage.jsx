import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../App';
import { Mail, Lock, User, Phone, Coffee, Eye, EyeOff } from 'lucide-react';

const AuthPage = ({ setAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('cashier'); // default role
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      showToast('Your session has expired. Please log in again.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast]);

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { email, password, full_name: fullName, phone, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLogin) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        setAuth(data);
        showToast(`Welcome back, ${data.full_name || 'User'}!`, 'success');
        
        // Navigate based on role
        if (data.role === 'barista') {
          navigate('/orders');
        } else {
          navigate('/dashboard');
        }
      } else {
        if (data.role === 'admin') {
          localStorage.setItem('userInfo', JSON.stringify(data));
          setAuth(data);
          showToast(`Welcome! Workspace auto-created and logged in as Administrator: ${data.full_name || 'User'}`, 'success');
          navigate('/dashboard');
        } else {
          showToast('Access request submitted successfully! Pending Admin approval.', 'success');
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at top left, #FAF7F2, #E8DCC4)',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }} className="auth-wrapper">
      {/* Background Coffee beans decor */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '300px',
        height: '300px',
        opacity: 0.05,
        transform: 'rotate(25deg)',
        pointerEvents: 'none'
      }}>
        <Coffee size={300} color="#8C6239" />
      </div>
      
      <div className="glass" style={{ 
        display: 'flex',
        width: '900px', 
        height: '580px',
        borderRadius: 'var(--radius-xl)', 
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(60, 40, 20, 0.15)',
        border: '1px solid rgba(255,255,255,0.7)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)'
      }}>
        
        {/* Left Side: Premium Handcrafted Coffee Shop Illustration */}
        <div style={{
          flex: 1.1,
          background: 'linear-gradient(135deg, #3B2A20, #1E140F)',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FAF7F2',
          position: 'relative'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: '#D4A373',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Coffee size={16} color="#1E140F" />
              </div>
              <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '1px' }}>CRFTD COFFEE</span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2 }}>
              Artisan Coffee <br />Management Suite
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#D3C2B5', marginTop: '0.5rem', fontWeight: 500 }}>
              Connecting POS, recipes studio, and real-time stocks.
            </p>
          </div>

          {/* Steaming Espresso SVG Illustration */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
            <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Steams */}
              <path d="M75,60 Q80,50 75,40" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
                <animate attributeName="stroke-dashoffset" values="10;0" dur="2s" repeatCount="indefinite" />
              </path>
              <path d="M95,58 Q100,45 95,35" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
                <animate attributeName="stroke-dashoffset" values="10;0" dur="1.8s" repeatCount="indefinite" />
              </path>
              <path d="M115,62 Q120,52 115,42" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" opacity="0.6">
                <animate attributeName="stroke-dashoffset" values="10;0" dur="2.2s" repeatCount="indefinite" />
              </path>
              
              {/* Coffee Maker Portafilter */}
              <rect x="50" y="80" width="100" height="24" rx="4" fill="#E8DCC4" />
              <rect x="50" y="94" width="10" height="20" rx="2" fill="#7A6F68" />
              <rect x="140" y="94" width="10" height="20" rx="2" fill="#7A6F68" />
              <path d="M75,104 L125,104" stroke="#7A6F68" strokeWidth="4" />
              <rect x="90" y="104" width="20" height="10" fill="#D4A373" />
              
              {/* Cup */}
              <path d="M70,120 C70,150 130,150 130,120 Z" fill="#FAF7F2" />
              <path d="M130,126 C136,126 142,132 142,138 C142,144 136,146 130,146" stroke="#FAF7F2" strokeWidth="4.5" fill="none" />
              <rect x="65" y="152" width="70" height="6" rx="3" fill="#D3C2B5" />
              
              {/* Espresso Drip Stream */}
              <line x1="100" y1="108" x2="100" y2="122" stroke="#8C6239" strokeWidth="3" strokeLinecap="round">
                <animate attributeName="stroke-width" values="2;4;2" dur="1s" repeatCount="indefinite" />
              </line>
            </svg>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#9E897A', fontWeight: '600' }}>
            © 2026 CRFTD Coffee. All rights reserved.
          </div>
        </div>

        {/* Right Side: Cozy Auth Login & Request Access Forms */}
        <div style={{ 
          flex: 1, 
          padding: '3rem', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {isLogin ? 'Welcome Back' : 'Access Request'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem', fontWeight: '600' }}>
            {isLogin ? 'Sign in to manage the coffee shop' : 'Submit access request to the administrator'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Full Name (Sign Up only) */}
            {!isLogin && (
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Full name" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem', height: '2.6rem', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            )}

            {/* Email Address */}
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                placeholder="Email address" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', height: '2.6rem', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            {/* Phone Number (Sign Up only) */}
            {!isLogin && (
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="tel" 
                  placeholder="Phone number" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem', height: '2.6rem', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            )}

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem', height: '2.6rem', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Role dropdown (Sign Up only) */}
            {!isLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>Request System Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', height: '2.6rem', padding: '0 1rem', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                >
                  <option value="cashier">Cashier (POS & Guest billing)</option>
                  <option value="barista">Barista (POS, Orders & Recipes)</option>
                  <option value="manager">Manager (Inventory, Staff & Supplies)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', height: '2.8rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Request Access')}
            </button>
          </form>

          {/* Switch Switcher link */}
          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '600' }}>
            {isLogin ? "Need system credentials? " : "Already submitted? "}
            <span 
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }} 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register account' : 'Log in here'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
