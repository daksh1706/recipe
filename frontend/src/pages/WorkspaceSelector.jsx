import React, { useState, useContext, useEffect } from 'react';
import { Coffee, Plus, Users, Send, LogOut, Loader2 } from 'lucide-react';
import { ToastContext } from '../App';

const WorkspaceSelector = ({ auth, setAuth, handleLogout }) => {
  const { showToast } = useContext(ToastContext);
  const [workspaceName, setWorkspaceName] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);

  // Pending Join Request States
  const [pendingRequest, setPendingRequest] = useState(null); // { workspaceName: '...' }
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);

  const checkPendingStatus = async (silent = false) => {
    if (!silent) setCheckingStatus(true);
    try {
      const response = await fetch('/api/workspace/join-status');
      if (response.ok) {
        const data = await response.json();
        if (data.pending) {
          setPendingRequest({ workspaceName: data.workspaceName });
        } else {
          setPendingRequest(null);
        }
      }
    } catch (error) {
      console.error('Error checking join request status:', error);
    } finally {
      if (!silent) setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkPendingStatus(true);
  }, []);

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      // 1. Fetch `/api/auth/me` to see if workspace_id has been approved/populated
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.workspace_id) {
          showToast('Workspace join request approved! Loading console...', 'success');
          
          const updatedUser = { 
            ...auth, 
            workspace_id: meData.workspace_id,
            workspace_name: meData.workspace_name || '',
            workspace_role: meData.role
          };
          
          localStorage.setItem('userInfo', JSON.stringify(updatedUser));
          setAuth(updatedUser);
          return;
        }
      }

      // 2. Otherwise refresh the pending request status
      const response = await fetch('/api/workspace/join-status');
      if (response.ok) {
        const data = await response.json();
        if (data.pending) {
          showToast('Your request is still pending Admin approval.', 'info');
          setPendingRequest({ workspaceName: data.workspaceName });
        } else {
          showToast('Your request has been approved or processed! Please try checking again or refresh.', 'warning');
          setPendingRequest(null);
        }
      }
    } catch (error) {
      showToast('Error checking request status', 'error');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel your request to join this workspace?')) {
      return;
    }
    setCancellingRequest(true);
    try {
      const response = await fetch('/api/workspace/join-cancel', {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Join request cancelled successfully.', 'warning');
        setPendingRequest(null);
      } else {
        const err = await response.json();
        showToast(err.message || 'Failed to cancel request.', 'error');
      }
    } catch (error) {
      showToast('Error cancelling request.', 'error');
    } finally {
      setCancellingRequest(false);
    }
  };

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

      if (data.pending) {
        showToast(data.message || 'Join request submitted for approval.', 'success');
        setPendingRequest({ workspaceName: data.workspace_name });
      } else {
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
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoadingJoin(false);
    }
  };

  // Render pending join request screen
  if (pendingRequest) {
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

        <div className="glass animate-slide-up" style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-panel)',
          boxShadow: 'var(--shadow-lg)',
          padding: '3rem 2.5rem',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            color: '#f59e0b',
            padding: '1.25rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Loader2 className="animate-spin" size={32} />
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.05em' }}>REQUEST SUBMITTED</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>Pending Admin Approval</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: '1.5' }}>
              Your request to join the workspace <strong style={{ color: 'var(--text-main)' }}>"{pendingRequest.workspaceName}"</strong> has been successfully submitted to the Administrator.
            </p>
            <p style={{ color: 'var(--text-muted)', opacity: 0.8, fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
              Please wait for the Admin to approve your access. Once approved, you can start managing orders, products, and inventory.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {checkingStatus ? 'Checking Status...' : 'Check Status Now'}
            </button>

            <button
              onClick={handleCancelRequest}
              disabled={cancellingRequest}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--error)',
                borderColor: 'var(--error)'
              }}
            >
              {cancellingRequest ? 'Cancelling...' : 'Cancel Request & Join Another'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', width: '100%', marginTop: '0.5rem' }}>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

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
