import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  Users, Search, Plus, Edit, Trash2, Calendar, Phone, Mail, Award, X, ShoppingBag, MessageSquare, Download
} from 'lucide-react';

const Customers = () => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // State
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
  const [activeProfile, setActiveProfile] = useState(null); // Detailed review panel
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data);
        setFilteredCustomers(data);
      } else {
        showToast(data.message || 'Failed to fetch customers', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search Filter logic
  useEffect(() => {
    if (!search) {
      setFilteredCustomers(customers);
    } else {
      const term = search.toLowerCase();
      setFilteredCustomers(customers.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.phone.includes(term)
      ));
    }
  }, [search, customers]);

  // Load detailed profile (with orders, feedback, and favorite menu items calculated)
  const handleCustomerClick = async (c) => {
    try {
      const res = await fetch(`/api/customers/profile/${c._id}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActiveProfile(data);
      } else {
        showToast(data.message || 'Failed to load guest profile', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Add / Edit Modal trigger
  const handleOpenModal = (c = null) => {
    if (c) {
      setEditId(c._id);
      setName(c.name);
      setPhone(c.phone);
      setEmail(c.email || '');
      setNotes(c.notes || '');
    } else {
      setEditId(null);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
    setShowModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      showToast('Phone number must be exactly 10 digits', 'warning');
      return;
    }

    const payload = { name, phone, email, notes };
    const url = editId ? `/api/customers/${editId}` : '/api/customers';
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Customer account saved!`, 'success');
        setShowModal(false);
        fetchCustomers();
        if (activeProfile && activeProfile._id === editId) {
          handleCustomerClick(data); // refresh profile details
        }
      } else {
        showToast(data.message || 'Saving customer failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCustomer = (id) => {
    setConfirmModal({
      show: true,
      title: 'Delete Customer Account',
      message: 'Are you sure you want to delete this customer account? Past order linkages will become anonymous.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/customers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          if (res.ok) {
            showToast('Guest record removed successfully', 'success');
            fetchCustomers();
            if (activeProfile?._id === id) setActiveProfile(null);
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

  // CSV Exporter
  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast('No guest data available to export', 'warning');
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Visits Count', 'Total Spent (INR)', 'First Visit', 'Last Visit', 'Notes'];
    const rows = customers.map(c => [
      c.name,
      c.phone,
      c.email || '',
      c.totalVisits,
      c.totalSpent,
      c.firstVisitDate || '',
      c.lastVisitDate || '',
      c.notes || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Customer_Loyalty_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer directory spreadsheet downloaded!', 'success');
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '88vh', overflow: 'hidden' }} className="mobile-stack">
      
      {/* 1. MAIN PANEL: CUSTOMERS DIRECTORY */}
      <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header and Actions bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Customers directory</h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Manage customer profiles, loyalty spent totals, and favorite products.</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleExportCSV} className="btn btn-secondary" style={{ height: '2.5rem', padding: '0 1rem' }}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ height: '2.5rem', padding: '0 1.25rem' }}>
              <Plus size={16} /> Add Customer
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1.5rem', flexShrink: 0 }}>
          <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem', height: '2.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-panel)' }}
          />
        </div>

        {/* Customer Cards grid list */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scroll">
          {filteredCustomers.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '30vh', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
              <p>No customer profiles found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filteredCustomers.map(c => (
                <div 
                  key={c._id} 
                  className="pos-item-card"
                  onClick={() => handleCustomerClick(c)}
                  style={{
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    padding: '1.5rem',
                    border: `1px solid ${activeProfile?._id === c._id ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: activeProfile?._id === c._id ? 'rgba(140, 98, 57, 0.03)' : 'var(--bg-panel)'
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{c.name}</h3>
                      {/* VIP Gold Star badge for > 10 visits */}
                      {c.isVIP && (
                        <span style={{ color: '#f0ad4e', display: 'inline-flex', alignItems: 'center' }} title="VIP Guest (>10 visits)">
                          <Award size={18} fill="#f0ad4e" />
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleOpenModal(c)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }} title="Edit"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteCustomer(c._id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d9534f', padding: '0.25rem' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem', fontWeight: '600' }}>
                    Phone: {c.phone}
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', width: '100%', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-subtle)', display: 'block', fontWeight: '700' }}>TOTAL VISITS</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.9rem' }}>{c.totalVisits} visit(s)</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-subtle)', display: 'block', fontWeight: '700' }}>TOTAL SPENT</span>
                      <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '0.9rem' }}>₹{c.totalSpent?.toFixed(1)}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. SIDE DRAWER PANEL: GUEST FULL PROFILE TIMELINES */}
      {activeProfile && (
        <div className="glass animate-slide-up" style={{ 
          width: '380px', 
          backgroundColor: 'var(--bg-panel)', 
          borderLeft: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          height: '86vh',
          flexShrink: 0
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem', flexShrink: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{activeProfile.name}</h3>
                {activeProfile.isVIP && <Award size={18} fill="#f0ad4e" color="#f0ad4e" />}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Phone: {activeProfile.phone}</span>
            </div>
            <button onClick={() => setActiveProfile(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
          </div>

          {/* Scrollable details: orders, feedback, favorites */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="custom-scroll">
            
            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-dark)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-subtle)', display: 'block' }}>FAVORITE DRINK/BITES</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary)' }}>{activeProfile.favoriteItem}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-subtle)', display: 'block' }}>VISITS TRACKED</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>{activeProfile.totalVisits} time(s)</span>
              </div>
            </div>

            {activeProfile.notes && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.25rem' }}>GUEST SPECIAL INSTRUCTIONS</span>
                <p style={{ fontSize: '0.8rem', fontStyle: 'italic', background: 'var(--border-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--text-main)' }}>{activeProfile.notes}</p>
              </div>
            )}

            {/* Past Orders list */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-subtle)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShoppingBag size={12} /> PAST ORDERS LEDGER ({activeProfile.orders?.length || 0})
              </span>

              {(!activeProfile.orders || activeProfile.orders.length === 0) ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No purchases recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }} className="custom-scroll">
                  {activeProfile.orders.map(order => (
                    <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{order.orderCode}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', display: 'block' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)' }}>₹{Number(order.grandTotal).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer reviews feedback history */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-subtle)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MessageSquare size={12} /> GUEST REVIEWS SUBMITTED ({activeProfile.feedback?.length || 0})
              </span>

              {(!activeProfile.feedback || activeProfile.feedback.length === 0) ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No feedback comments submitted.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }} className="custom-scroll">
                  {activeProfile.feedback.map(fb => (
                    <div key={fb._id} style={{ padding: '0.6rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'rgba(140, 98, 57, 0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.7rem' }}>
                        <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>Product: {fb.menuItem}</span>
                        <span style={{ color: '#f0ad4e', fontWeight: '800' }}>★ {fb.rating}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', fontStyle: 'italic', margin: 0, color: 'var(--text-muted)' }}>"{fb.comment || 'No comment'}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 3. ADD / EDIT GUEST PROFILE MODAL */}
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
            width: '420px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editId ? 'Modify Guest Details' : 'Onboard Guest'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Customer Name</label>
                <input type="text" required placeholder="E.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Phone Number (10 digits)</label>
                <input type="tel" maxLength={10} required placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                <input type="email" placeholder="rahul.sharma@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Special Notes / Preferences</label>
                <textarea rows="3" placeholder="Loves extra foam cappuccino. No sugar." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: '0.5rem' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '2.6rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                Save Guest Profile
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

export default Customers;
