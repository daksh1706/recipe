import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  Users, Plus, Edit, Trash2, Phone, Mail, MapPin, FileText, X, Package, Layers
} from 'lucide-react';

const Suppliers = () => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // State
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeSupplier, setActiveSupplier] = useState(null); // Detailed review side drawer
  const [showFormModal, setShowFormModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [itemsSupplied, setItemsSupplied] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('COD');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(0);
  const [notes, setNotes] = useState('');

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuppliers(data);
      } else {
        showToast(data.message || 'Failed to fetch suppliers', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Fetch individual supplier detailed profile (with raw materials)
  const handleSupplierClick = async (s) => {
    try {
      const res = await fetch(`/api/suppliers/${s._id}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSupplier(data);
      } else {
        showToast(data.message || 'Failed to load vendor details', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Add / Edit Modal trigger
  const handleOpenModal = (s = null) => {
    if (s) {
      setEditId(s._id);
      setName(s.name);
      setContactPerson(s.contactPerson || '');
      setPhone(s.phone || '');
      setEmail(s.email || '');
      setAddress(s.address || '');
      setItemsSupplied(s.itemsSupplied || '');
      setPaymentTerms(s.paymentTerms || '');
      setDeliveryDays(s.deliveryDays || '');
      setMinimumOrderQuantity(s.minimumOrderQuantity || 0);
      setNotes(s.notes || '');
    } else {
      setEditId(null);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setItemsSupplied('');
      setPaymentTerms('COD');
      setDeliveryDays('');
      setMinimumOrderQuantity(0);
      setNotes('');
    }
    setShowFormModal(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      contactPerson,
      phone,
      email,
      address,
      itemsSupplied,
      paymentTerms,
      deliveryDays,
      minimumOrderQuantity: Number(minimumOrderQuantity),
      notes
    };

    const url = editId ? `/api/suppliers/${editId}` : '/api/suppliers';
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
        showToast(`Supplier ${editId ? 'updated' : 'added'} successfully!`, 'success');
        setShowFormModal(false);
        fetchSuppliers();
        if (activeSupplier && activeSupplier._id === editId) {
          handleSupplierClick(data); // refresh side panel
        }
      } else {
        showToast(data.message || 'Failed to save vendor', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier? Raw materials will remain but will lose their vendor linkage.')) return;

    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.ok) {
        showToast('Supplier removed successfully', 'success');
        fetchSuppliers();
        if (activeSupplier?._id === id) setActiveSupplier(null);
      } else {
        const data = await res.json();
        showToast(data.message || 'Deletion failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '88vh', overflow: 'hidden' }} className="mobile-stack">
      
      {/* 1. MAIN PANEL: SUPPLIERS DIRECTORY */}
      <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header Action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Supplier Hub</h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Manage wholesale vendors, purchase terms, and raw supply rosters.</span>
          </div>

          <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ height: '2.5rem', padding: '0 1.25rem' }}>
            <Plus size={16} /> Add Supplier
          </button>
        </div>

        {/* Suppliers cards list */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scroll">
          {suppliers.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
              <p>No wholesale suppliers added yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {suppliers.map(s => (
                <div 
                  key={s._id} 
                  className="pos-item-card"
                  onClick={() => handleSupplierClick(s)}
                  style={{
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    padding: '1.5rem',
                    border: `1px solid ${activeSupplier?._id === s._id ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: activeSupplier?._id === s._id ? 'rgba(140, 98, 57, 0.03)' : 'var(--bg-panel)'
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{s.name}</h3>
                    
                    <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleOpenModal(s)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }} title="Edit Details"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteSupplier(s._id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d9534f', padding: '0.25rem' }} title="Delete Vendor"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-dark)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '800', color: 'var(--primary)', display: 'inline-block', marginBottom: '1rem' }}>
                    Port: {s.itemsSupplied || 'General Supplies'}
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', width: '100%', color: 'var(--text-muted)', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    {s.contactPerson && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={14} /> <span>{s.contactPerson}</span></div>}
                    {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> <span>{s.phone}</span></div>}
                    {s.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</span></div>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', width: '100%' }}>
                    <div>
                      <span style={{ color: 'var(--text-subtle)', display: 'block', fontWeight: '700' }}>PAYMENT TERMS</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>{s.paymentTerms || 'COD'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-subtle)', display: 'block', fontWeight: '700' }}>DELIVERIES</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>{s.deliveryDays || 'As needed'}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. SIDE DRAWER PANEL: DETAILED LINKS INVENTORY */}
      {activeSupplier && (
        <div className="glass animate-slide-up" style={{ 
          width: '360px', 
          backgroundColor: 'var(--bg-panel)', 
          borderLeft: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          height: '86vh',
          flexShrink: 0
        }}>
          {/* Side Drawer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{activeSupplier.name}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Supply Roster Mapping</span>
            </div>
            <button onClick={() => setActiveSupplier(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
          </div>

          {/* Supplier Address and Notes info */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="custom-scroll">
            
            {activeSupplier.address && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.25rem' }}>OFFICE ADDRESS</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}><MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />{activeSupplier.address}</p>
              </div>
            )}

            {activeSupplier.notes && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.25rem' }}>INTERNAL NOTES</span>
                <div style={{ background: 'var(--border-light)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontStyle: 'italic', borderLeft: '3px solid var(--primary)', color: 'var(--text-main)' }}>
                  {activeSupplier.notes}
                </div>
              </div>
            )}

            {/* List of supplied raw materials */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.75rem' }}>RAW INVENTORY SUPPLIED</span>
              
              {(!activeSupplier.rawMaterials || activeSupplier.rawMaterials.length === 0) ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No raw inventory materials currently linked to this supplier. Link them inside the Inventory Dashboard.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {activeSupplier.rawMaterials.map(item => (
                    <div key={item._id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={14} color="var(--primary)" />
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', display: 'block' }}>{item.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Code: {item.itemCode}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', display: 'block' }}>
                          {(() => {
                            const stock = Number(item.currentStock);
                            const unit = item.unit || '';
                            if (stock >= 1000 && (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gm' || unit.toLowerCase() === 'ml')) {
                              return `${(stock / 1000).toFixed(1)} ${unit.toLowerCase() === 'ml' ? 'L' : 'kg'}`;
                            }
                            return `${item.currentStock} ${item.unit}`;
                          })()}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cost: ₹{item.costPerUnit}/{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 3. SUPPLIER ADD / EDIT FORM MODAL */}
      {showFormModal && (
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
            width: '500px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editId ? 'Modify Wholesale Vendor' : 'Onboard Supplier'}
              </h3>
              <button onClick={() => setShowFormModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }} className="custom-scroll">
              
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Supplier / Vendor Name</label>
                <input type="text" required placeholder="Arabica Coffee Co." value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Contact Person</label>
                  <input type="text" placeholder="John Agent" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
                  <input type="tel" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                  <input type="email" placeholder="sales@coffee.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Payment Terms</label>
                  <input type="text" placeholder="Net 30 / COD" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Port (Items Supplied)</label>
                  <input type="text" placeholder="Espresso Beans, Syrups" value={itemsSupplied} onChange={(e) => setItemsSupplied(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Delivery Schedule</label>
                  <input type="text" placeholder="Mon, Thu" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Address</label>
                <input type="text" placeholder="Chikmagalur Coffee Estate, KA" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Internal Comments Notes</label>
                <textarea rows="3" placeholder="Primary coffee bean provider. Net 30 invoices." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: '0.75rem' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '2.6rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                Save Supplier Account
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
