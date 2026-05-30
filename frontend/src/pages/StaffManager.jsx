import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  Users, Plus, Edit, Trash2, Calendar, Phone, Mail, Clock, Shield, Award, Check, X
} from 'lucide-react';

const StaffManager = () => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // Active View Tab: 'roster', 'calendar', 'performance'
  const [activeTab, setActiveTab] = useState('roster');

  // Roster States
  const [roster, setRoster] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const isManagerOrAdmin = ['admin', 'manager'].includes((auth.role || '').toLowerCase());

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editRoster, setEditRoster] = useState(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Form Fields
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('cashier');
  const [shift, setShift] = useState('morning');
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isActive, setIsActive] = useState(true);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchData = async () => {
    try {
      // 1. Fetch Staff Roster
      const rostRes = await fetch('/api/staff/roster', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (rostRes.ok) {
        const rostData = await rostRes.json();
        setRoster(rostData);
      }

      if (isManagerOrAdmin) {
        // 2. Fetch all approved users for manual roster onboarding dropdown
        const userRes = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setAllUsers(userData.filter(u => u.status === 'approved'));
        }

        // 3. Fetch Staff Performance
        const perfRes = await fetch('/api/staff/performance', {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (perfRes.ok) {
          const perfData = await perfRes.json();
          setPerformance(perfData);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resOk = (res) => res.ok;

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle dynamic days selection
  const handleDayToggle = (day) => {
    setWorkingDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  // Open Add/Edit form Modal
  const handleOpenModal = (r = null) => {
    if (r) {
      setEditRoster(r);
      setUserId(r.userId || r.user_id);
      setRole(r.role);
      setShift(r.shift);
      setWorkingDays(r.workingDays || []);
      setMonthlySalary(r.monthlySalary);
      setJoiningDate(r.joiningDate || '');
      setEmergencyContact(r.emergencyContact || '');
      setIsActive(r.isActive);
    } else {
      setEditRoster(null);
      setUserId('');
      setRole('cashier');
      setShift('morning');
      setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      setMonthlySalary('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setEmergencyContact('');
      setIsActive(true);
    }
    setShowModal(true);
  };

  const handleSaveRoster = async (e) => {
    e.preventDefault();

    if (!userId) {
      showToast('Please select a system user', 'warning');
      return;
    }

    if (workingDays.length === 0) {
      showToast('Please select at least one working day', 'warning');
      return;
    }

    const payload = {
      userId,
      role,
      shift,
      workingDays,
      monthlySalary: Number(monthlySalary),
      joiningDate,
      emergencyContact,
      isActive
    };

    try {
      const res = await fetch('/api/staff/roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Staff roster profile saved successfully!', 'success');
        setShowModal(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Saving failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRoster = (id) => {
    setConfirmModal({
      show: true,
      title: 'Delete Staff Member',
      message: 'Are you sure you want to delete this staff member from the active roster? User account remains.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/staff/roster/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          if (res.ok) {
            showToast('Staff roster profile deleted', 'success');
            fetchData();
          } else {
            const data = await res.json();
            showToast(data.message || 'Deletion failed', 'error');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Compile weekly shifts calendar grid
  const getShiftsForDay = (day, targetShift) => {
    return roster.filter(r => 
      r.isActive && 
      r.shift === targetShift && 
      r.workingDays && 
      r.workingDays.includes(day)
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass skeleton" style={{ width: '120px', height: '2.5rem', borderRadius: '30px' }} />
          <div className="glass skeleton" style={{ width: '120px', height: '2.5rem', borderRadius: '30px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Staff & Roster</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Manage shift schedules, monthly salaries, and staff sales performance.</span>
        </div>

        {isManagerOrAdmin && (
          <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ height: '2.5rem', padding: '0 1.25rem' }}>
            <Plus size={16} /> Onboard Staff
          </button>
        )}
      </div>

      {/* Tabs Selector Navigation (Roster cards / weekly shifts calendar / performance) */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'roster', label: 'Staff Roster Cards', icon: <Users size={16} /> },
          { id: 'calendar', label: 'Weekly Shift Schedule', icon: <Calendar size={16} /> },
          isManagerOrAdmin && { id: 'performance', label: 'Sales Performance Metrics', icon: <Award size={16} /> }
        ].filter(Boolean).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              transition: 'var(--transition)'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: ROSTER CARDS */}
      {activeTab === 'roster' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {roster.length === 0 ? (
            <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '30vh', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
              <p>No active staff profiles recorded in roster.</p>
            </div>
          ) : (
            roster.map(r => {
              const u = r.user || {};
              return (
                <div key={r._id} className="pos-item-card" style={{ alignItems: 'flex-start', textAlign: 'left', padding: '1.5rem', opacity: r.isActive ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', justify: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{u.fullName || 'Staff Member'}</h3>
                    
                    {isManagerOrAdmin && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => handleOpenModal(r)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }} title="Edit"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteRoster(r._id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d9534f', padding: '0.25rem' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', backgroundColor: 'var(--bg-dark)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                      {r.role}
                    </span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', backgroundColor: 'var(--border-light)', color: 'var(--text-muted)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                      Shift: {r.shift?.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', width: '100%', borderBottom: '1px dashed var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                    {u.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> <span>{u.phone}</span></div>}
                    {u.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> <span>{u.email}</span></div>}
                    {r.emergencyContact && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d9534f' }}><AlertTriangle size={14} /> <span>ICE: {r.emergencyContact}</span></div>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.5rem', fontSize: '0.75rem', width: '100%' }}>
                    <div>
                      <span style={{ color: 'var(--text-subtle)', display: 'block', fontWeight: '700' }}>MONTHLY SALARY</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>₹{r.monthlySalary?.toFixed(0)}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-subtle)', display: 'block', fontWeight: '700' }}>JOINING DATE</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>{r.joiningDate ? new Date(r.joiningDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT 2: WEEKLY SHIFTS CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary)" /> Weekly Shifts Schedule
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ width: '120px', padding: '0.75rem 0.5rem' }}>Shift</th>
                {daysOfWeek.map(day => (
                  <th key={day} style={{ padding: '0.75rem 0.5rem' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Morning Shift */}
              <tr>
                <td style={{ padding: '1.5rem 0.5rem', fontWeight: '800', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-dark)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', color: '#f0ad4e' }}>
                    <Clock size={16} /> Morning
                  </div>
                </td>
                {daysOfWeek.map(day => {
                  const staff = getShiftsForDay(day, 'morning');
                  return (
                    <td key={day} style={{ padding: '1rem 0.5rem', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {staff.map(s => (
                          <div key={s._id} style={{ fontSize: '0.75rem', fontWeight: '700', backgroundColor: 'rgba(140, 98, 57, 0.05)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--text-main)' }}>
                            {s.user?.fullName || 'Staff'} <span style={{ fontSize: '0.6rem', color: 'var(--primary)', block: 'block' }}>({s.role})</span>
                          </div>
                        ))}
                        {staff.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>None scheduled</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Evening Shift */}
              <tr>
                <td style={{ padding: '1.5rem 0.5rem', fontWeight: '800', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-dark)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', color: 'var(--primary)' }}>
                    <Clock size={16} /> Evening
                  </div>
                </td>
                {daysOfWeek.map(day => {
                  const staff = getShiftsForDay(day, 'evening');
                  return (
                    <td key={day} style={{ padding: '1rem 0.5rem', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {staff.map(s => (
                          <div key={s._id} style={{ fontSize: '0.75rem', fontWeight: '700', backgroundColor: 'rgba(140, 98, 57, 0.05)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--text-main)' }}>
                            {s.user?.fullName || 'Staff'} <span style={{ fontSize: '0.65rem', color: 'var(--primary)', block: 'block' }}>({s.role})</span>
                          </div>
                        ))}
                        {staff.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>None scheduled</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Full Day Shift */}
              <tr>
                <td style={{ padding: '1.5rem 0.5rem', fontWeight: '800', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-dark)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', color: '#d9534f' }}>
                    <Shield size={16} /> Full Day
                  </div>
                </td>
                {daysOfWeek.map(day => {
                  const staff = getShiftsForDay(day, 'full_day');
                  return (
                    <td key={day} style={{ padding: '1rem 0.5rem', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {staff.map(s => (
                          <div key={s._id} style={{ fontSize: '0.75rem', fontWeight: '700', backgroundColor: 'rgba(140, 98, 57, 0.05)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--text-main)' }}>
                            {s.user?.fullName || 'Staff'} <span style={{ fontSize: '0.65rem', color: 'var(--primary)', block: 'block' }}>({s.role})</span>
                          </div>
                        ))}
                        {staff.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>None scheduled</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT 3: STAFF SALES PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--primary)" /> Staff Sales Performance Overview
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem 0.5rem' }}>Staff Name</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>System Email</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Active Role</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Total Transactions Handled</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total Store Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {performance.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-subtle)' }}>No sales transactions tracked by staff yet. Place POS orders to link them.</td>
                </tr>
              ) : (
                performance.map(s => (
                  <tr key={s.id} className="hover-brighten">
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{s.fullName}</td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>{s.email}</td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', backgroundColor: 'var(--bg-dark)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                        {s.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center', fontWeight: '700' }}>{s.totalOrdersHandled} order(s)</td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>₹{s.totalRevenueGenerated?.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD ROSTER ONBOARDING FORM MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass" style={{
            width: '480px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editRoster ? 'Update Staff Roster Record' : 'Onboard User to Roster'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveRoster} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }} className="custom-scroll">
              
              {/* User Selector Dropdown (locked on edit) */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Associate User Account</label>
                {editRoster ? (
                  <input type="text" disabled value={editRoster.user?.fullName || editRoster.user?.email || 'Associated User'} />
                ) : (
                  <select value={userId} required onChange={(e) => setUserId(e.target.value)}>
                    <option value="">-- Choose User Profile --</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName || u.email} ({u.role})</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Active Shift</label>
                  <select value={shift} onChange={(e) => setShift(e.target.value)}>
                    <option value="morning">Morning Shift</option>
                    <option value="evening">Evening Shift</option>
                    <option value="full_day">Full Day Shift</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>System Role Gated</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="cashier">Cashier</option>
                    <option value="barista">Barista</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Monthly Salary (₹)</label>
                  <input type="number" required min="0" placeholder="Salary INR" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Emergency Contact (ICE)</label>
                  <input type="text" placeholder="98765 43210" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Joining Date</label>
                <input type="date" required value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
              </div>

              {/* Working Days Checkbox lists */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Working Schedule Days</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {daysOfWeek.map(day => {
                    const isChecked = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        style={{
                          height: '2rem',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '0.75rem',
                          background: isChecked ? 'rgba(140, 98, 57, 0.15)' : 'transparent',
                          color: isChecked ? 'var(--primary)' : 'var(--text-muted)',
                          borderColor: isChecked ? 'var(--primary)' : 'var(--border)'
                        }}
                      >
                        {isChecked && <Check size={10} style={{ display: 'inline', marginRight: '0.2rem' }} />}{day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>Active Staff Member (Active shift scheduling)</label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '2.6rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                Save Roster Profile
              </button>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div className="glass animate-slide-up" style={{
            width: '400px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(217, 83, 79, 0.15)',
              color: '#d9534f',
              marginBottom: '1rem'
            }}>
              <Trash2 size={32} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              {confirmModal.title || 'Are you sure?'}
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {confirmModal.message}
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="btn btn-secondary" 
                style={{ flex: 1, height: '2.5rem', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
                className="btn" 
                style={{ 
                  flex: 1, 
                  height: '2.5rem', 
                  backgroundColor: '#d9534f', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffManager;
