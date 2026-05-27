import React, { useState, useEffect, useContext } from 'react';
import { Clock, CheckCircle, Bell, MessageSquare, ChefHat, Play, Check } from 'lucide-react';
import { ToastContext } from '../App';

const ActiveOrders = () => {
  const { showToast } = useContext(ToastContext);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Polling for new orders every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        // Show only active pipeline orders: pending, preparing, and ready
        const active = data.filter(o => ['pending', 'preparing', 'ready'].includes((o.status || '').toLowerCase()));
        setOrders(active);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const updateStatus = async (id, newStatus, orderCode) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        showToast(`Order ${orderCode} advanced to '${newStatus}'!`);
        fetchOrders(); // refresh list
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update order status', 'error');
      }
    } catch (err) {
      console.error('Failed to update status', err);
      showToast('Network error updating status', 'error');
    }
  };

  const sendPickupAlert = (order) => {
    const phone = order.customer?.phone;
    const name = order.customer?.name || 'Customer';
    const code = order.orderCode || order.order_code || 'Order';
    const message = `Hi ${name}, your order #${code} from CRFTD Coffee is ready for pickup! ☕🍩\nCome grab it from the counter!`;
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/91${phone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
    showToast('WhatsApp pickup notification draft opened!');
  };

  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((new Date() - new Date(createdAt)) / 60000); // in minutes
    if (diff < 1) return 'Just now';
    return `${diff} min ago`;
  };

  // Group by status
  const pendingOrders = orders.filter(o => (o.status || '').toLowerCase() === 'pending');
  const preparingOrders = orders.filter(o => (o.status || '').toLowerCase() === 'preparing');
  const readyOrders = orders.filter(o => (o.status || '').toLowerCase() === 'ready');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Active Prep Queue</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time display for Baristas and Cache staff to track coffee prep pipelines</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flex: 1, minHeight: '600px' }}>
        
        {/* Column 1: Pending (New Orders) */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock color="#ef4444" size={20} />
              <h2 style={{ margin: 0, color: '#ef4444', fontSize: '1.15rem' }}>New / Pending</h2>
            </div>
            <span style={{ background: '#ef4444', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {pendingOrders.length}
            </span>
          </div>
          
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>No pending orders.</p>
            ) : pendingOrders.map(order => (
              <div key={order._id} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                    #{order.orderCode || 'ORD-0000'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12}/> {getElapsedTime(order.createdAt)}
                  </span>
                </div>
                
                <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {order.customer?.name || 'Walk-in Customer'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Type: <span style={{ textTransform: 'capitalize' }}>{order.orderType?.replace('_', ' ')}</span> 
                    {order.tableNumber && ` • Table ${order.tableNumber}`}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginRight: '0.4rem' }}>{item.quantity}x</span>
                        {item.menuItem?.name || 'Unknown Item'}
                      </span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245,158,11,0.05)', padding: '0.4rem', borderRadius: '4px' }}>
                    Note: {order.notes}
                  </div>
                )}

                <button 
                  onClick={() => updateStatus(order._id, 'preparing', order.orderCode)}
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem' }}
                >
                  <Play size={16} /> Start Preparing
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Preparing (In Kitchen) */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChefHat color="#f59e0b" size={20} />
              <h2 style={{ margin: 0, color: '#f59e0b', fontSize: '1.15rem' }}>Preparing</h2>
            </div>
            <span style={{ background: '#f59e0b', color: 'black', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {preparingOrders.length}
            </span>
          </div>
          
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {preparingOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>No preparing items.</p>
            ) : preparingOrders.map(order => (
              <div key={order._id} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontFamily: 'monospace', fontSize: '1.1rem', color: '#f59e0b', fontWeight: 'bold' }}>
                    #{order.orderCode || 'ORD-0000'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12}/> {getElapsedTime(order.createdAt)}
                  </span>
                </div>
                
                <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {order.customer?.name || 'Walk-in Customer'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Type: <span style={{ textTransform: 'capitalize' }}>{order.orderType?.replace('_', ' ')}</span> 
                    {order.tableNumber && ` • Table ${order.tableNumber}`}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginRight: '0.4rem' }}>{item.quantity}x</span>
                        {item.menuItem?.name || 'Unknown Item'}
                      </span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245,158,11,0.05)', padding: '0.4rem', borderRadius: '4px' }}>
                    Note: {order.notes}
                  </div>
                )}

                <button 
                  onClick={() => updateStatus(order._id, 'ready', order.orderCode)}
                  className="btn" 
                  style={{ width: '100%', marginTop: '0.5rem', background: '#f59e0b', color: 'black', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem' }}
                >
                  <Bell size={16} /> Mark as Ready
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Ready (Pickup / Serve) */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle color="#10b981" size={20} />
              <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.15rem' }}>Ready to Serve</h2>
            </div>
            <span style={{ background: '#10b981', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {readyOrders.length}
            </span>
          </div>
          
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {readyOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>No orders ready for pickup.</p>
            ) : readyOrders.map(order => (
              <div key={order._id} style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontFamily: 'monospace', fontSize: '1.1rem', color: '#10b981', fontWeight: 'bold' }}>
                    #{order.orderCode || 'ORD-0000'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12}/> {getElapsedTime(order.createdAt)}
                  </span>
                </div>
                
                <div style={{ borderBottom: '1px dashed rgba(16, 185, 129, 0.2)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {order.customer?.name || 'Walk-in Customer'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Type: <span style={{ textTransform: 'capitalize' }}>{order.orderType?.replace('_', ' ')}</span> 
                    {order.tableNumber && ` • Table ${order.tableNumber}`}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginRight: '0.4rem' }}>{item.quantity}x</span>
                        {item.menuItem?.name || 'Unknown Item'}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {order.customer?.phone && (
                    <button 
                      onClick={() => sendPickupAlert(order)}
                      className="btn btn-secondary" 
                      style={{ flex: 1, borderColor: '#25D366', color: '#25D366', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                      title="Send WhatsApp pickup alert"
                    >
                      <MessageSquare size={16} /> Alert
                    </button>
                  )}
                  <button 
                    onClick={() => updateStatus(order._id, 'served', order.orderCode)}
                    className="btn btn-primary" 
                    style={{ flex: 2, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                  >
                    <Check size={16} /> Serve Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ActiveOrders;
