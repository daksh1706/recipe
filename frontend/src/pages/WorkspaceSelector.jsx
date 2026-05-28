import React, { useState, useContext } from 'react';
import { Coffee, Plus, Users, Send, LogOut, Loader2 } from 'lucide-react';
import { ToastContext } from '../App';

const WorkspaceSelector = ({ auth, setAuth, handleLogout }) => {
  const { showToast } = useContext(ToastContext);
  const [workspaceName, setWorkspaceName] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);

  // 1. Handle Workspace Creation
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      showToast('Please enter a valid workspace name', 'error');
      return;
    }

    setLoadingCreate(true);
    try {
      const response = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workspace_name: workspaceName.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create workspace');
      }

      showToast(`Workspace "${data.workspace_name}" created successfully! Invite Code: ${data.share_code}`, 'success');

      // Update session auth state
      const updatedUser = { 
        ...auth, 
        workspace_id: data.id, 
        workspace_name: data.workspace_name, 
        workspace_role: data.role 
      };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setAuth(updatedUser);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoadingCreate(false);
    }
  };

  // 2. Handle Joining Existing Workspace
  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!shareCode.trim() || shareCode.trim().length !== 6 || isNaN(shareCode)) {
      showToast('Please enter a valid 6-digit numeric share code', 'error');
      return;
    }

    setLoadingJoin(true);
    try {
      const response = await fetch('/api/workspace/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ share_code: shareCode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join workspace');
      }

      showToast(`Successfully joined workspace "${data.workspace_name}"!`, 'success');

      // Update session auth state
      const updatedUser = { 
        ...auth, 
        workspace_id: data.id, 
        workspace_name: data.workspace_name, 
        workspace_role: data.role 
      };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setAuth(updatedUser);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-dark)',
      padding: '2rem',
      position: 'relative',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Background Graphic Accents */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(140, 98, 57, 0.05) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212, 163, 115, 0.06) 0%, transparent 70%)',
        filter: 'blur(50px)',
        zIndex: 0
      }} />

      {/* Main Glassmorphic Container */}
      <div className="glass animate-slide-up" style={{
        width: '100%',
        maxWidth: '840px',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--bg-panel)',
        boxShadow: 'var(--shadow-lg)',
        padding: '3rem 2.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Header Branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                backgroundColor: 'rgba(140, 98, 57, 0.1)',
                color: 'var(--primary)',
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)'
              }}>
                <Coffee size={24} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>CRFTD Coffee Shop</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Hello, <strong style={{ color: 'var(--text-main)' }}>{auth.full_name}</strong>. Create a new workspace or join an existing team to get started.
            </p>
          </div>
          
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* 2-Column Split Cards Option */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          
          {/* Card 1: Create Workspace */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--primary)' }}><Plus size={20} /></div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Create Workspace</h2>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Establish a new independent workspace. This generates a unique 6-digit invitation code so other baristas, managers, and cashiers can join you.
            </p>

            <form onSubmit={handleCreateWorkspace} style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Workspace name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. CRFTD Downtown Coffee" 
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  style={{
                    backgroundColor: '#fafafa',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loadingCreate}
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                {loadingCreate ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Creating Workspace...
                  </>
                ) : (
                  <>
                    Create Workspace
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Vertical Divider Line */}
          <div style={{
            position: 'absolute',
            top: '32%',
            bottom: '5%',
            left: '50%',
            width: '1px',
            backgroundColor: 'var(--border)',
            display: 'block'
          }} className="d-md-none" />

          {/* Card 2: Join Workspace */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--primary)' }}><Users size={20} /></div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Join Workspace</h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Enter the 6-digit invitation code generated by your store owner. You will instantly gain access to the store's POS menu, live orders, inventory, and ledger.
            </p>

            <form onSubmit={handleJoinWorkspace} style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>6-Digit Share Code</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  placeholder="e.g. 123456" 
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  style={{
                    backgroundColor: '#fafafa',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    letterSpacing: '0.35em',
                    fontWeight: 'bold',
                    color: 'var(--primary)'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loadingJoin}
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                {loadingJoin ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Join Existing Workspace
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

export default WorkspaceSelector;
