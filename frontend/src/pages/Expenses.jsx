import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { 
  Plus, Edit, Trash2, Calendar, DollarSign, Download, Filter, X, CreditCard, PieChart as PieIcon
} from 'lucide-react';

const Expenses = () => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // States
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawMaterials, setRawMaterials] = useState([]);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields
  const [category, setCategory] = useState('rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidTo, setPaidTo] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Restock-specific fields for raw_materials
  const [selectedSegment, setSelectedSegment] = useState('coffee_beans');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [restockQuantity, setRestockQuantity] = useState('');

  const categories = [
    { value: 'rent', label: 'Rent Space' },
    { value: 'electricity', label: 'Electricity Utility' },
    { value: 'staff_salary', label: 'Staff Salaries' },
    { value: 'raw_materials', label: 'Raw Inventory' },
    { value: 'packaging', label: 'Packaging Materials' },
    { value: 'equipment', label: 'Cafe Equipment' },
    { value: 'marketing', label: 'Marketing Promo' },
    { value: 'maintenance', label: 'Shop Maintenance' },
    { value: 'miscellaneous', label: 'Miscellaneous' }
  ];

  const categoriesList = [
    { value: 'coffee_beans', label: 'Coffee Beans' },
    { value: 'milk', label: 'Milk Type' },
    { value: 'dairy', label: 'Dairy & Cheese' },
    { value: 'syrups', label: 'Beverage Syrups' },
    { value: 'sauces', label: 'Beverage Sauces' },
    { value: 'bakery', label: 'Bakery Pastries' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'packaging', label: 'Packaging Cups' },
    { value: 'cleaning', label: 'Cleaning Supplies' },
    { value: 'chocolate_cocoa', label: 'Chocolate & Cocoa' },
    { value: 'fruits_veg', label: 'Fresh Produce' },
    { value: 'specialty', label: 'Dried & Specialty' },
    { value: 'dry_goods', label: 'Dry Goods' },
    { value: 'other', label: 'Other Items' }
  ];

  const CHART_COLORS = ['#8C6239', '#D4A373', '#AFA59E', '#E07A5F', '#5bc0de', '#d9534f', '#2D231E', '#E9D8A6', '#C3905D'];

  const fetchExpenses = async () => {
    try {
      let url = `/api/expenses?category=${categoryFilter}&startDate=${startDate}&endDate=${endDate}`;
      if (paymentFilter) url += `&payment=${paymentFilter}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setExpenses(data);
      } else {
        showToast(data.message || 'Failed to fetch expenses', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const res = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRawMaterials(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, startDate, endDate, paymentFilter]);

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  // Calculations for KPI Cards
  const calculateSummaries = () => {
    let total = 0;
    let rent = 0;
    let salaries = 0;
    let raw = 0;
    let other = 0;

    expenses.forEach(e => {
      const amt = Number(e.amount || 0);
      total += amt;
      
      if (e.category === 'rent') rent += amt;
      else if (e.category === 'staff_salary') salaries += amt;
      else if (e.category === 'raw_materials') raw += amt;
      else other += amt;
    });

    return { total, rent, salaries, raw, other };
  };

  const sums = calculateSummaries();

  // Category breakdown for Pie Chart
  const getPieData = () => {
    const counts = {};
    expenses.forEach(e => {
      const catLabel = categories.find(c => c.value === e.category)?.label || e.category;
      counts[catLabel] = (counts[catLabel] || 0) + Number(e.amount || 0);
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const pieData = getPieData();

  // CSV Exporter
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      showToast('No expense logs available to export', 'warning');
      return;
    }

    const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Payment Method', 'Paid To', 'Comments'];
    const rows = expenses.map(e => [
      new Date(e.created_at).toLocaleDateString(),
      e.category,
      e.description,
      e.amount,
      e.paymentMethod,
      e.paidTo,
      e.notes || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Expense spreadsheet exported!', 'success');
  };

  // CRUD triggers
  const handleOpenModal = (e = null) => {
    if (e) {
      setEditId(e._id);
      setCategory(e.category);
      setDescription(e.description || '');
      setAmount(e.amount);
      setPaymentMethod(e.paymentMethod || 'cash');
      setPaidTo(e.paidTo || '');
      setReceiptUrl(e.receiptUrl || '');
      setNotes(e.notes || '');
      setSelectedSegment('coffee_beans');
      setSelectedMaterialId('');
      setRestockQuantity('');
    } else {
      setEditId(null);
      setCategory('rent');
      setDescription('');
      setAmount('');
      setPaymentMethod('cash');
      setPaidTo('');
      setReceiptUrl('');
      setNotes('');
      setSelectedSegment('coffee_beans');
      setSelectedMaterialId('');
      setRestockQuantity('');
    }
    setShowModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();

    if (category === 'raw_materials') {
      if (!selectedMaterialId) {
        showToast('Please select a raw material item to restock.', 'warning');
        return;
      }
      if (!restockQuantity || Number(restockQuantity) <= 0) {
        showToast('Please enter a restock quantity greater than 0.', 'warning');
        return;
      }
    }

    // Call restocking API directly if creating a new raw_materials expense
    if (!editId && category === 'raw_materials') {
      try {
        const mat = rawMaterials.find(m => m.id === selectedMaterialId);
        const res = await fetch(`/api/inventory/${selectedMaterialId}/restock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({
            quantity: Number(restockQuantity),
            totalCost: Number(amount),
            notes: notes || `Logged via expense tracker: ${description}`
          })
        });
        if (res.ok) {
          showToast(`Stock replenished for ${mat ? mat.name : 'item'} and logged as expense!`, 'success');
          setShowModal(false);
          fetchExpenses();
          fetchRawMaterials();
        } else {
          const err = await res.json();
          showToast(err.message || 'Restock failed', 'error');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
      return;
    }

    const payload = {
      category,
      description,
      amount: Number(amount),
      paymentMethod,
      paidTo,
      receiptUrl,
      notes
    };

    const url = editId ? `/api/expenses/${editId}` : '/api/expenses';
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
      if (res.ok) {
        showToast(`Expense logged successfully!`, 'success');
        setShowModal(false);
        fetchExpenses();
      } else {
        const err = await res.json();
        showToast(err.message || 'Saving failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteExpense = (id) => {
    setConfirmModal({
      show: true,
      title: 'Delete Expense Record',
      message: 'Are you sure you want to delete this expense log? This action is irreversible.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          if (res.ok) {
            showToast('Expense log removed', 'success');
            fetchExpenses();
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="glass skeleton" style={{ height: '90px', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header operations bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Expenses Tracker</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Monitor monthly operating overheads, staff salaries, utilities, and material purchases.</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ height: '2.5rem', padding: '0 1rem' }}>
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ height: '2.5rem', padding: '0 1.25rem' }}>
            <Plus size={16} /> Log Expense
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards (Rent, salary, raw materials, summaries) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }} className="mobile-stack">
        
        <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>TOTAL EXPENSES</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{sums.total.toFixed(1)}</span>
        </div>

        <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #D4A373' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>RENT OVERHEADS</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{sums.rent.toFixed(1)}</span>
        </div>

        <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #5bc0de' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>STAFF SALARIES</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{sums.salaries.toFixed(1)}</span>
        </div>

        <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #AFA59E' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>RAW MATERIALS</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{sums.raw.toFixed(1)}</span>
        </div>

        <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--text-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>OTHER EXPENSES</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{sums.other.toFixed(1)}</span>
        </div>

      </div>

      {/* MAIN BODY: Donut charts splits + Filterable table list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }} className="mobile-stack">
        
        {/* Category donut chart */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={16} color="var(--primary)" /> Expense Splits
          </h3>

          <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'center' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--text-muted)', width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>No expenses categorized.</p>
            )}
          </div>
          
          {/* Simple Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '1rem', maxHeight: '120px', overflowY: 'auto' }} className="custom-scroll">
            {pieData.map((entry, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                  {entry.name}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>₹{entry.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses List & Filter console */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Advanced Filter Inputs bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
            <Filter size={16} color="var(--text-subtle)" />
            
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '130px', height: '2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ width: '120px', height: '2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              <option value="">All Payments</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '120px', height: '2rem', padding: '0 0.4rem', fontSize: '0.75rem' }} />
              <span style={{ color: 'var(--text-subtle)' }}>to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '120px', height: '2rem', padding: '0 0.4rem', fontSize: '0.75rem' }} />
            </div>
            
            {(categoryFilter || paymentFilter || startDate || endDate) && (
              <button 
                onClick={() => { setCategoryFilter(''); setPaymentFilter(''); setStartDate(''); setEndDate(''); }}
                style={{ border: 'none', background: 'transparent', color: '#d9534f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: '700' }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Ledger Table grid */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Description</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Paid To</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Method</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-subtle)' }}>No expenses logged matching search.</td>
                  </tr>
                ) : (
                  expenses.map(e => {
                    const date = new Date(e.created_at).toLocaleDateString();
                    const catName = categories.find(c => c.value === e.category)?.label || e.category;
                    return (
                      <tr key={e._id} className="hover-brighten">
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>{date}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: '700', fontSize: '0.85rem' }}>{catName}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.description}>{e.description}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem' }}>{e.paidTo || 'N/A'}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{e.paymentMethod}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{Number(e.amount).toFixed(1)}</td>
                        
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button onClick={() => handleOpenModal(e)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }} title="Edit"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteExpense(e._id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d9534f', padding: '0.25rem' }} title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* CRUD MODAL FOR ADDING / EDITING EXPENSES */}
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
            width: '600px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editId ? 'Modify Expense Record' : 'Record Operating Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Category Tag</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Amount Spent (₹)</label>
                  <input type="number" required min="1.00" placeholder="Amount INR" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>

              {category === 'raw_materials' && !editId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px dashed var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(140, 98, 57, 0.05)' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>Material Segment</label>
                    <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)}>
                      {categoriesList.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>Item Select</label>
                    <select 
                      value={selectedMaterialId} 
                      onChange={(e) => {
                        const matId = e.target.value;
                        setSelectedMaterialId(matId);
                        const mat = rawMaterials.find(m => m.id === matId);
                        if (mat) {
                          setDescription(`Restocked ${mat.name}`);
                          setPaidTo(mat.supplier ? mat.supplier.name : '');
                        }
                      }}
                      required={category === 'raw_materials'}
                    >
                      <option value="">-- Select Item --</option>
                      {rawMaterials.filter(m => m.category === selectedSegment).map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>Restock Quantity ({rawMaterials.find(m => m.id === selectedMaterialId)?.unit || ''})</label>
                    <input 
                      type="number" 
                      required={category === 'raw_materials'} 
                      min="0.1" 
                      step="any"
                      placeholder="e.g. 50" 
                      value={restockQuantity} 
                      onChange={(e) => setRestockQuantity(e.target.value)} 
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Payment Mode</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI Transfer</option>
                    <option value="card">Card Sweep</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Paid To / Vendor Name</label>
                  <input type="text" placeholder="State Power Co. / Arabica Beans Trader" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Description Summary</label>
                  <input type="text" required placeholder="Electricity invoice for the month of May" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Receipt File Link (URL)</label>
                  <input type="text" placeholder="https://image-hosting.com/receipt.jpg" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Internal Notes</label>
                <textarea rows="2" placeholder="Auto debit scheduled on the 5th." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: '0.5rem' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '2.6rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                Save Expense Record
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
              <Plus size={32} style={{ transform: 'rotate(45deg)' }} />
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

export default Expenses;
