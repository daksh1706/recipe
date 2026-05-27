import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts';
import { 
  Trash2, Plus, Calendar, AlertTriangle, HelpCircle, Filter, DollarSign, X, CheckCircle
} from 'lucide-react';

const WasteLog = () => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // Roster States
  const [logs, setLogs] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [summary, setSummary] = useState({ totalWastedQuantity: 0, totalWastedLoss: 0, breakdown: {} });
  const [loading, setLoading] = useState(true);

  // Filters
  const [reasonFilter, setReasonFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form Modal Trigger
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [rawMaterialId, setRawMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [reason, setReason] = useState('spoiled');
  const [notes, setNotes] = useState('');

  const reasons = [
    { value: 'expired', label: 'Expired Product' },
    { value: 'overcooked', label: 'Overcooked / Burnt' },
    { value: 'dropped', label: 'Dropped / Spilled' },
    { value: 'unsold', label: 'Unsold Fresh Goods' },
    { value: 'spoiled', label: 'Spoiled / Rotting' },
    { value: 'other', label: 'Other Reason' }
  ];

  const CHART_COLORS = ['#8C6239', '#D4A373', '#AFA59E', '#E07A5F', '#5bc0de', '#d9534f'];

  const fetchData = async () => {
    try {
      // 1. Fetch Waste Logs
      let url = `/api/waste?reason=${reasonFilter}&startDate=${startDate}&endDate=${endDate}`;
      const logRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const logData = await logRes.json();
      if (logRes.ok) setLogs(logData);

      // 2. Fetch monthly summaries for charts
      const sumRes = await fetch('/api/waste/summary', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const sumData = await sumRes.json();
      if (sumRes.ok) setSummary(sumData);

      // 3. Fetch Raw Materials for selector & unit cost previews
      const matRes = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const matData = await matRes.json();
      if (matRes.ok) setRawMaterials(matData);

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reasonFilter, startDate, endDate]);

  // Sync selected raw material's unit
  useEffect(() => {
    if (rawMaterialId) {
      const selected = rawMaterials.find(m => m._id === rawMaterialId);
      if (selected) setUnit(selected.unit);
    }
  }, [rawMaterialId, rawMaterials]);

  // Real-time Loss Estimation Preview
  const calculateLossPreview = () => {
    if (!rawMaterialId || !quantity) return 0;
    const selected = rawMaterials.find(m => m._id === rawMaterialId);
    if (!selected) return 0;
    return Number(selected.costPerUnit || 0) * Number(quantity);
  };

  const lossPreview = calculateLossPreview();

  const handleSaveWaste = async (e) => {
    e.preventDefault();

    if (!rawMaterialId) {
      showToast('Please select a raw material', 'warning');
      return;
    }

    const payload = {
      rawMaterialId,
      quantity: Number(quantity),
      unit,
      reason,
      notes
    };

    try {
      const res = await fetch('/api/waste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Wastage logged and stock deducted!', 'success');
        setShowModal(false);
        // Clear fields
        setRawMaterialId('');
        setQuantity('');
        setNotes('');
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Saving failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Format reasons for Bar Chart
  const getBarData = () => {
    if (!summary.breakdown) return [];
    return Object.entries(summary.breakdown).map(([key, val]) => {
      const label = reasons.find(r => r.value === key)?.label || key;
      return { name: label, loss: Number(val || 0) };
    }).filter(d => d.loss > 0);
  };

  const barData = getBarData();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass skeleton" style={{ height: '90px', borderRadius: '8px' }} />
          <div className="glass skeleton" style={{ height: '90px', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Spoilage Waste Log</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Log dropped, expired, or spoiled ingredients, track valuation losses, and audit stock write-offs.</span>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ height: '2.5rem', padding: '0 1.25rem' }}>
          <Plus size={16} /> Log Spoilage Waste
        </button>
      </div>

      {/* Monthly Summary Cards (Total Qty, Total Lost Valuation) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mobile-stack">
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--border-light)', color: 'var(--primary)' }}>
            <Trash2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>TOTAL WASTED QUANTITY (CURRENT MONTH)</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{summary.totalWastedQuantity?.toFixed(1)} units</span>
          </div>
        </div>

        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #d9534f', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(217, 83, 79, 0.1)', color: '#d9534f' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>TOTAL FINANCIAL VALUE LOSS (₹)</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#d9534f' }}>₹{summary.totalWastedLoss?.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* MAIN BODY: Loss Chart + History Table list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '2rem' }} className="mobile-stack">
        
        {/* Wastage reasons chart */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} color="var(--primary)" /> Valuation Loss by Reason
          </h3>

          <div style={{ width: '100%', height: '220px' }}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={9} interval={0} />
                  <YAxis stroke="var(--text-subtle)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                  <Bar dataKey="loss" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No wastage metrics recorded.</div>
            )}
          </div>
        </div>

        {/* Waste History table */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Advanced filter console */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
            <Filter size={16} color="var(--text-subtle)" />

            <select 
              value={reasonFilter} 
              onChange={(e) => setReasonFilter(e.target.value)}
              style={{ width: '150px', height: '2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              <option value="">All Spoilage Reasons</option>
              {reasons.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '120px', height: '2rem', padding: '0 0.4rem', fontSize: '0.75rem' }} />
              <span style={{ color: 'var(--text-subtle)' }}>to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '120px', height: '2rem', padding: '0 0.4rem', fontSize: '0.75rem' }} />
            </div>

            {(reasonFilter || startDate || endDate) && (
              <button 
                onClick={() => { setReasonFilter(''); setStartDate(''); setEndDate(''); }}
                style={{ border: 'none', background: 'transparent', color: '#d9534f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: '700' }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* History table list */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Material</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Wasted Qty</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Est. Loss (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Recorded By</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Notes comments</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-subtle)' }}>No spoilage logs recorded matching filters.</td>
                  </tr>
                ) : (
                  logs.map(l => {
                    const date = new Date(l.created_at).toLocaleString();
                    const reasonName = reasons.find(r => r.value === l.reason)?.label || l.reason;
                    return (
                      <tr key={l._id} className="hover-brighten">
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-subtle)', fontSize: '0.75rem' }}>{date}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>{l.rawMaterialName}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem' }}>{l.quantity} {l.unit}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '30px', backgroundColor: 'rgba(217,83,79,0.1)', color: '#d9534f' }}>
                            {reasonName}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: '800', color: '#d9534f' }}>₹{l.estimatedLoss?.toFixed(1)}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}>{l.recordedUser?.fullName || 'System Admin'}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.notes}>{l.notes || 'N/A'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* RECORD WASTE POPUP FORM MODAL */}
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
            width: '450px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Log Spoilage / Waste Intake
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveWaste} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Select Raw Material */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Select Raw Material</label>
                <select value={rawMaterialId} required onChange={(e) => setRawMaterialId(e.target.value)}>
                  <option value="">-- Choose Stock Item --</option>
                  {rawMaterials.map(mat => (
                    <option key={mat._id} value={mat._id}>{mat.name} ({mat.currentStock} {mat.unit} in stock)</option>
                  ))}
                </select>
              </div>

              {/* Quantity and Unit (auto synced) */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Quantity Wasted</label>
                  <input type="number" required min="0.001" step="any" placeholder="Quantity value" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Inventory Unit</label>
                  <input type="text" disabled value={unit} style={{ backgroundColor: 'var(--border-light)' }} />
                </div>
              </div>

              {/* Spoilage Reason */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Reason for Spoilage</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {reasons.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Details Comments</label>
                <textarea rows="2" placeholder="Dropped bag during unloading / Expired shelf milk." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: '0.5rem' }} />
              </div>

              {/* Real-time Lost Valuation Preview */}
              {rawMaterialId && quantity && (
                <div style={{ background: 'rgba(217, 83, 79, 0.08)', border: '1px solid rgba(217, 83, 79, 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>Estimated Financial Loss</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#d9534f' }}>₹{lossPreview.toFixed(1)}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '2.6rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                <CheckCircle size={16} /> Log Spoilage & Deduct Stock
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WasteLog;
