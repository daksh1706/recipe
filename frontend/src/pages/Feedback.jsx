import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts';
import { 
  MessageSquare, Star, Plus, CheckCircle, Clock, AlertCircle, Filter, X, Check
} from 'lucide-react';

const Feedback = () => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // States
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalFeedback: 0, distribution: { 1:0, 2:0, 3:0, 4:0, 5:0 } });
  const [loading, setLoading] = useState(true);

  // Filters
  const [ratingFilter, setRatingFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('');

  // Resolution Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeFbId, setActiveFbId] = useState(null);
  const [actionTaken, setActionTaken] = useState('');

  const CHART_COLORS = ['#d9534f', '#f0ad4e', '#5bc0de', '#8C6239', '#5cb85c'];

  const fetchFeedback = async () => {
    try {
      let url = `/api/feedback?rating=${ratingFilter}`;
      if (resolvedFilter) url += `&isResolved=${resolvedFilter}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (res.ok) setFeedbacks(data);

      const sumRes = await fetch('/api/feedback/summary', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const sumData = await sumRes.json();
      if (sumRes.ok) setSummary(sumData);

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [ratingFilter, resolvedFilter]);

  const handleResolveFeedback = async (e) => {
    e.preventDefault();

    if (!actionTaken) {
      showToast('Action taken note is required', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/feedback/${activeFbId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ actionTaken })
      });
      if (res.ok) {
        showToast('Complaint resolved successfully!', 'success');
        setShowModal(false);
        setActionTaken('');
        fetchFeedback();
      } else {
        const err = await res.json();
        showToast(err.message || 'Resolution failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Format Recharts distribution data
  const getBarData = () => {
    const dist = summary.distribution || {};
    return [
      { name: '1 Star', count: dist[1] || 0 },
      { name: '2 Stars', count: dist[2] || 0 },
      { name: '3 Stars', count: dist[3] || 0 },
      { name: '4 Stars', count: dist[4] || 0 },
      { name: '5 Stars', count: dist[5] || 0 }
    ];
  };

  const barData = getBarData();

  // Render Stars Row helper
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          fill={i <= rating ? '#f0ad4e' : 'none'} 
          color={i <= rating ? '#f0ad4e' : 'var(--text-subtle)'} 
          style={{ marginRight: '1px' }}
        />
      );
    }
    return <div style={{ display: 'flex', alignItems: 'center' }}>{stars}</div>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass skeleton" style={{ height: '95px', borderRadius: '8px' }} />
          <div className="glass skeleton" style={{ height: '95px', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header action bar */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Reviews Feedback</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Monitor guest reviews, star ratings distributions, and resolve operational issues.</span>
      </div>

      {/* Top Summary Cards (Average Score, total reviews count) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mobile-stack">
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(140, 98, 57, 0.1)', color: 'var(--primary)' }}>
            <Star size={24} fill="var(--primary)" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>AVERAGE GUEST RATING SCORE</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {summary.averageRating?.toFixed(1)} / 5.0
              {renderStars(Math.round(summary.averageRating))}
            </span>
          </div>
        </div>

        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #5bc0de', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--border-light)', color: '#5bc0de' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>TOTAL REVIEWS SUBMITTED</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{summary.totalFeedback} review(s)</span>
          </div>
        </div>
      </div>

      {/* MAIN BODY: Recharts star breakdown + filterable table list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '2rem' }} className="mobile-stack">
        
        {/* Rating distribution chart */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} fill="var(--primary)" color="var(--primary)" /> Rating Score Distribution
          </h3>

          <div style={{ width: '100%', height: '220px' }}>
            {summary.totalFeedback > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={10} />
                  <YAxis stroke="var(--text-subtle)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No feedback distribution.</div>
            )}
          </div>
        </div>

        {/* Feedback Ledger table */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Advanced filter controls */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
            <Filter size={16} color="var(--text-subtle)" />

            <select 
              value={ratingFilter} 
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{ width: '130px', height: '2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              <option value="">All Star Ratings</option>
              <option value="1">1 Star reviews</option>
              <option value="2">2 Star reviews</option>
              <option value="3">3 Star reviews</option>
              <option value="4">4 Star reviews</option>
              <option value="5">5 Star reviews</option>
            </select>

            <select 
              value={resolvedFilter} 
              onChange={(e) => setResolvedFilter(e.target.value)}
              style={{ width: '140px', height: '2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              <option value="">All Resolutions</option>
              <option value="false">Action Required</option>
              <option value="true">Resolved</option>
            </select>

            {(ratingFilter || resolvedFilter) && (
              <button 
                onClick={() => { setRatingFilter(''); setResolvedFilter(''); }}
                style={{ border: 'none', background: 'transparent', color: '#d9534f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: '700' }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Feedback table list */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Guest Phone</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Product</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Score</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Comment</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Resolution</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Action Taken</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-subtle)' }}>No feedback comments recorded.</td>
                  </tr>
                ) : (
                  feedbacks.map(fb => (
                    <tr key={fb._id} className="hover-brighten">
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: '700', fontSize: '0.8rem' }}>{fb.customerName}</td>
                      <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}>{fb.menuItemName}</td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>{renderStars(fb.rating)}</td>
                      <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fb.comment}>{fb.comment || 'N/A'}</td>
                      
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        {fb.isResolved ? (
                          <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(92,184,92,0.15)', color: '#5cb85c', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.1rem' }}><Check size={10} /> Resolved</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(217,83,79,0.15)', color: '#d9534f', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.1rem' }}><AlertCircle size={10} /> Action Req</span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-subtle)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fb.actionTaken}>
                        {fb.actionTaken || 'Pending review...'}
                      </td>

                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        {!fb.isResolved && (
                          <button 
                            onClick={() => { setActiveFbId(fb._id); setShowModal(true); }}
                            className="btn btn-secondary"
                            style={{ height: '1.6rem', padding: '0 0.5rem', fontSize: '0.7rem', fontWeight: '700', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* RESOLVE COMPLAINT POPUP MODAL */}
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
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Resolve Feedback Complaint
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleResolveFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Action Taken Description</label>
                <textarea 
                  rows="4" 
                  required
                  placeholder="E.g. Refunded client and retrained barista Bob on milk milk temperature texturing." 
                  value={actionTaken} 
                  onChange={(e) => setActionTaken(e.target.value)} 
                  style={{ padding: '0.75rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '2.6rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                <CheckCircle size={16} /> Mark Complaint as Resolved
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Feedback;
