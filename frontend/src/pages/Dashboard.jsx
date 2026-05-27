import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { 
  ShoppingBag, DollarSign, Clock, AlertTriangle, Users, BookOpen, Coffee, RefreshCw, ChevronRight, PackageCheck
} from 'lucide-react';

const Dashboard = () => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // KPI States
  const [kpis, setKpis] = useState({
    totalOrdersToday: 0,
    revenueToday: 0,
    pendingOrders: 0,
    lowStockAlerts: 0,
    totalCustomers: 0,
    netProfitThisMonth: 0
  });

  // Chart States
  const [charts, setCharts] = useState({
    dailyRevenue: [],
    topItems: [],
    categorySales: [],
    expenseBreakdown: []
  });

  // Feeds
  const [liveOrders, setLiveOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Coffee Theme Palette colors
  const CHART_COLORS = ['#8C6239', '#D4A373', '#AFA59E', '#E07A5F', '#5bc0de', '#d9534f', '#2D231E'];

  const fetchData = async () => {
    try {
      // 1. Fetch KPIs
      const kpiRes = await fetch('/api/reports/kpis', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const kpiData = await kpiRes.json();
      if (kpiRes.ok) setKpis(kpiData);

      // 2. Fetch Charts
      const chartRes = await fetch('/api/reports/charts', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const chartData = await chartRes.json();
      if (chartRes.ok) setCharts(chartData);

      // 3. Fetch Last 5 Orders for Feed
      const orderRes = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const orderData = await orderRes.json();
      if (orderRes.ok) {
        setLiveOrders(orderData.slice(0, 5));
      }

      // 4. Fetch Low Stock Materials
      const matRes = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const matData = await matRes.json();
      if (matRes.ok) {
        const low = matData.filter(m => m.currentStock <= m.minimumStockLevel);
        setLowStockItems(low);
      }

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-poll every 15s to simulate real-time updates safely
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Quick manual restock action for raw materials
  const handleRestock = async (id, name, qty) => {
    try {
      const res = await fetch(`/api/inventory/${id}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ quantity: qty, notes: 'Quick restock from Dashboard' })
      });
      if (res.ok) {
        showToast(`Restocked ${qty} units of ${name}!`, 'success');
        fetchData(); // refresh
      } else {
        const err = await res.json();
        showToast(err.message || 'Restock failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Status Colors Badge Helper
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { bg: 'rgba(240, 173, 78, 0.15)', text: '#f0ad4e' };
      case 'preparing': return { bg: 'rgba(240, 173, 78, 0.25)', text: '#d9534f' };
      case 'ready': return { bg: 'rgba(91, 192, 222, 0.15)', text: '#5bc0de' };
      case 'served': return { bg: 'rgba(92, 184, 92, 0.15)', text: '#5cb85c' };
      case 'cancelled': return { bg: 'rgba(217, 83, 79, 0.15)', text: '#d9534f' };
      default: return { bg: 'var(--border)', text: 'var(--text-muted)' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass skeleton" style={{ height: '100px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div className="glass skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
          <div className="glass skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Store Operations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
            Real-time Coffee shop dashboard  |  Role: <span style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{auth.role}</span>
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ height: '2.5rem', padding: '0 1rem' }}>
          <RefreshCw size={16} /> Sync Live Data
        </button>
      </div>

      {/* 2. KPI Metrics deck */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* KPI 1 */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(140, 98, 57, 0.1)', color: 'var(--primary)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>ORDERS TODAY</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{kpis.totalOrdersToday}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #D4A373' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(212, 163, 115, 0.15)', color: '#D4A373' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>REVENUE TODAY</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{Number(kpis.revenueToday).toFixed(1)}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #5bc0de' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(91, 192, 222, 0.15)', color: '#5bc0de' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>PENDING QUEUE</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{kpis.pendingOrders}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${kpis.lowStockAlerts > 0 ? '#d9534f' : 'var(--border)'}` }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: kpis.lowStockAlerts > 0 ? 'rgba(217, 83, 79, 0.15)' : 'var(--border-light)', color: kpis.lowStockAlerts > 0 ? '#d9534f' : 'var(--text-subtle)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>LOW STOCK ITEMS</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: kpis.lowStockAlerts > 0 ? '#d9534f' : 'var(--text-main)' }}>{kpis.lowStockAlerts}</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--text-muted)' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--border-light)', color: 'var(--text-muted)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>TOTAL GUESTS</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{kpis.totalCustomers}</span>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${kpis.netProfitThisMonth >= 0 ? '#5cb85c' : '#d9534f'}` }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: kpis.netProfitThisMonth >= 0 ? 'rgba(92, 184, 92, 0.15)' : 'rgba(217, 83, 79, 0.15)', color: kpis.netProfitThisMonth >= 0 ? '#5cb85c' : '#d9534f' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>PROFIT THIS MONTH</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: kpis.netProfitThisMonth >= 0 ? '#5cb85c' : '#d9534f' }}>
              {kpis.netProfitThisMonth >= 0 ? '' : '-'}₹{Math.abs(kpis.netProfitThisMonth).toFixed(1)}
            </span>
          </div>
        </div>

      </div>

      {/* 3. CHARTS SECTIONS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="mobile-stack">
        
        {/* Chart Row 1 Left: Daily Revenue line graph */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem' }}>Daily Sales Distribution (Current Month)</h3>
          <div style={{ width: '100%', height: '260px' }}>
            {charts.dailyRevenue && charts.dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.dailyRevenue}>
                  <XAxis dataKey="date" stroke="var(--text-subtle)" fontSize={11} />
                  <YAxis stroke="var(--text-subtle)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No sales logged this month yet.</div>
            )}
          </div>
        </div>

        {/* Chart Row 1 Right: Category sales pie chart */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem' }}>Revenue by Product Category</h3>
          <div style={{ width: '100%', height: '260px', display: 'flex', alignItems: 'center' }}>
            {charts.categorySales && charts.categorySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categorySales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', fontWeight: '600' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No category stats.</div>
            )}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }} className="mobile-stack">
        
        {/* Chart Row 2 Left: Expenses breakdown donut chart */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem' }}>Operating Expense Breakdown</h3>
          <div style={{ width: '100%', height: '260px' }}>
            {charts.expenseBreakdown && charts.expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {charts.expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                  <Legend align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '0.7rem', fontWeight: '600' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No expenses recorded.</div>
            )}
          </div>
        </div>

        {/* Chart Row 2 Right: Best selling bar chart */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem' }}>Top 10 Best Selling Products (Weekly Volume)</h3>
          <div style={{ width: '100%', height: '260px' }}>
            {charts.topItems && charts.topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topItems}>
                  <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={9} interval={0} />
                  <YAxis stroke="var(--text-subtle)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                  <Bar dataKey="quantity" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                    {charts.topItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--secondary)' : 'var(--primary)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No weekly product quantities tracked.</div>
            )}
          </div>
        </div>

      </div>

      {/* 4. FEEDS SECTION GRID: Live POS orders queue + Low Stock items */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="mobile-stack">
        
        {/* Live POS queue feed */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--primary)" /> Live POS Active Feed (Last 5)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
            {liveOrders.length === 0 ? (
              <p style={{ color: 'var(--text-subtle)', textAlign: 'center', padding: '3rem 0' }}>No active orders in ledger.</p>
            ) : (
              liveOrders.map(order => {
                const badge = getStatusStyle(order.status);
                return (
                  <div key={order._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-dark)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>{order.orderCode}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        Type: {order.orderType?.toUpperCase()}  |  Total: ₹{Number(order.grandTotal || 0).toFixed(1)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '30px',
                        backgroundColor: badge.bg,
                        color: badge.text
                      }}>
                        {order.status}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: '600' }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low stock alert panel */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color={lowStockItems.length > 0 ? '#d9534f' : 'var(--text-muted)'} /> Stock Alert Panel
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {lowStockItems.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '2rem 0', color: '#5cb85c' }}>
                <PackageCheck size={36} style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: '800' }}>All materials fully stocked!</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'rgba(217, 83, 79, 0.03)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#d9534f', fontWeight: '700' }}>
                      Stock: {(() => {
                        const stock = Number(item.currentStock);
                        const unit = item.unit || '';
                        if (stock >= 1000 && (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gm' || unit.toLowerCase() === 'ml')) {
                          return `${(stock / 1000).toFixed(1)} ${unit.toLowerCase() === 'ml' ? 'L' : 'kg'}`;
                        }
                        return `${item.currentStock} ${item.unit}`;
                      })()} (Min: {(() => {
                        const min = Number(item.minimumStockLevel);
                        const unit = item.unit || '';
                        if (min >= 1000 && (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gm' || unit.toLowerCase() === 'ml')) {
                          return `${(min / 1000).toFixed(1)} ${unit.toLowerCase() === 'ml' ? 'L' : 'kg'}`;
                        }
                        return `${item.minimumStockLevel} ${item.unit}`;
                      })()})
                    </span>
                  </div>

                  <button 
                    onClick={() => handleRestock(item._id, item.name, item.reorderQuantity || 50)}
                    className="btn btn-secondary"
                    style={{
                      height: '1.8rem',
                      padding: '0 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    Reorder {item.reorderQuantity || 50}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
