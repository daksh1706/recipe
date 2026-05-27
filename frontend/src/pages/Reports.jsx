import React, { useState, useEffect, useMemo, useContext } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { IndianRupee, TrendingUp, ShoppingBag, CreditCard, Calendar, Download, Eye, BarChart3 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ToastContext } from '../App';

const Reports = () => {
  const { showToast } = useContext(ToastContext);
  
  // Year & Month state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDailyLoading, setIsDailyLoading] = useState(false);

  // Retrieve store profile details for PDF reporting
  const storeDetails = useMemo(() => {
    const saved = localStorage.getItem('storeDetails');
    return saved ? JSON.parse(saved) : {
      name: 'CRFTD Coffee House',
      gstin: '27CRFTD0000A1Z5',
      address: 'Premium Crafted Experience, 123 Espresso Avenue',
      phone: '9876543210'
    };
  }, []);

  useEffect(() => {
    fetchMonthlyReports();
    setSelectedMonthIndex(null);
    setDailyData([]);
  }, [selectedYear]);

  const fetchMonthlyReports = async () => {
    setIsLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
      const res = await fetch(`/api/reports/monthly?year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data);
      } else {
        showToast('Failed to load financial summaries', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading financial summaries', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyReports = async (monthIndex) => {
    setIsDailyLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
      const res = await fetch(`/api/reports/daily?year=${selectedYear}&month=${monthIndex}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDailyData(data);
        setSelectedMonthIndex(monthIndex);
      } else {
        showToast('Failed to load daily reports', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading daily reports', 'error');
    } finally {
      setIsDailyLoading(false);
    }
  };

  // Year select items
  const availableYears = [2025, 2026, 2027, 2028];

  // Annual Totals calculations
  const annualSummary = useMemo(() => {
    let gross = 0, discounts = 0, gst = 0, netRev = 0, expenses = 0, profit = 0;
    
    monthlyData.forEach(m => {
      gross += m.grossRevenue || 0;
      discounts += m.discounts || 0;
      gst += m.gstCollected || 0;
      netRev += m.netRevenue || 0;
      expenses += m.totalExpenses || 0;
      profit += m.netProfit || 0;
    });

    const margin = netRev > 0 ? (profit / netRev) * 100 : 0;

    return {
      gross,
      discounts,
      gst,
      netRev,
      expenses,
      profit,
      margin
    };
  }, [monthlyData]);

  // jsPDF Annual P&L Financial Statement Exporter
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let y = 15;

      // Title & Shop details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(storeDetails.name.toUpperCase(), 15, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Address: ${storeDetails.address}`, 15, y);
      y += 4;
      doc.text(`Phone: +91 ${storeDetails.phone} | GSTIN: ${storeDetails.gstin}`, 15, y);
      y += 6;

      // Divider line
      doc.setDrawColor(200);
      doc.line(15, y, 195, y);
      y += 10;

      // Title Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`ANNUAL PROFIT & LOSS REPORT - FY ${selectedYear}`, 15, y);
      y += 8;

      // Consolidated Summary Table
      doc.setFontSize(10);
      doc.setFillColor(245, 245, 245);
      doc.rect(15, y, 180, 24, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.text("Annual Net Revenue", 20, y + 8);
      doc.text("Annual Operating Outflow", 80, y + 8);
      doc.text("Net Profit / Margin", 140, y + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Rs. ${annualSummary.netRev.toFixed(2)}`, 20, y + 16);
      doc.text(`Rs. ${annualSummary.expenses.toFixed(2)}`, 80, y + 16);
      
      const marginColor = annualSummary.profit >= 0 ? 'green' : 'red';
      doc.text(`Rs. ${annualSummary.profit.toFixed(2)} (${annualSummary.margin.toFixed(1)}%)`, 140, y + 16);
      y += 32;

      // Monthly Statements Table Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("Monthly Profit & Loss Summary Breakdown", 15, y);
      y += 6;

      doc.setFontSize(8.5);
      doc.setFillColor(140, 98, 57); // Warm brown header accent
      doc.rect(15, y, 180, 7.5, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.text("Month", 18, y + 5);
      doc.text("Gross Sales", 48, y + 5);
      doc.text("Discounts", 74, y + 5);
      doc.text("GST Coll.", 98, y + 5);
      doc.text("Net Rev", 122, y + 5);
      doc.text("Expenses", 146, y + 5);
      doc.text("Net Profit", 170, y + 5);

      y += 7.5;
      doc.setTextColor(0, 0, 0);

      // Print month entries
      monthlyData.forEach((m, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, y, 180, 6, 'F');
        }
        
        doc.setFont('helvetica', 'normal');
        doc.text(m.month, 18, y + 4.5);
        doc.text(m.grossRevenue.toFixed(0), 48, y + 4.5);
        doc.text(m.discounts.toFixed(0), 74, y + 4.5);
        doc.text(m.gstCollected.toFixed(0), 98, y + 4.5);
        doc.text(m.netRevenue.toFixed(0), 122, y + 4.5);
        doc.text(m.totalExpenses.toFixed(0), 146, y + 4.5);

        // Highlight Net Profit with bold text and sign matching
        doc.setFont('helvetica', 'bold');
        doc.text((m.netProfit >= 0 ? '+' : '') + m.netProfit.toFixed(0), 170, y + 4.5);
        
        y += 6;
      });

      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Report Compiled on: ${new Date().toLocaleString()}`, 15, y);
      doc.text("Confidential Store Operational Ledger. Under Strict Admin Permissions.", 15, y + 4);

      doc.save(`annual_report_${selectedYear}.pdf`);
      showToast(`Financial statement PDF generated for Year ${selectedYear}!`);
    } catch (err) {
      console.error(err);
      showToast('Error exporting statement PDF', 'error');
    }
  };

  const getSelectedMonthName = () => {
    if (selectedMonthIndex === null) return '';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[selectedMonthIndex];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title & Actions Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Financial Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>P&L Balance cards, comparative cost curves, and drilldowns</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Year selector dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Calendar size={18} color="var(--text-muted)" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1rem', cursor: 'pointer', outline: 'none', boxShadow: 'none', padding: 0 }}
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr} style={{ background: 'var(--bg-panel)' }}>Year {yr}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleExportPDF}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={18} /> Export Statement PDF
          </button>
        </div>
      </div>

      {/* Annual Summary KPI Cards */}
      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'linear-gradient(135deg, rgba(140, 98, 57, 0.15), transparent)', width: '100px', height: '100px', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(140, 98, 57, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
               <IndianRupee size={22} color="var(--primary)" />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Annual Net Revenue</span>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-main)' }}>₹{annualSummary.netRev.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
               <CreditCard size={22} color="#ef4444" />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Annual Outflow Expenses</span>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>₹{annualSummary.expenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: annualSummary.profit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
               <TrendingUp size={22} color={annualSummary.profit >= 0 ? '#10b981' : '#ef4444'} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Annual Net profit</span>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0, color: annualSummary.profit >= 0 ? '#10b981' : '#ef4444' }}>
            ₹{annualSummary.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </h2>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
               <ShoppingBag size={22} color="#3b82f6" />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Annual profit Margin</span>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>{annualSummary.margin.toFixed(2)}%</h2>
        </div>
      </div>

      {/* Comparative Line Graph for Revenue, Expense & Profit */}
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
        <h3 style={{ marginBottom: '2rem', fontSize: '1.25rem' }}>Annual Operations Trend Curve - FY {selectedYear}</h3>
        <div style={{ height: '320px', width: '100%' }}>
          {isLoading ? (
            <div className="skeleton" style={{ height: '100%' }}></div>
          ) : monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" name="Net Revenue" dataKey="netRevenue" stroke="#8C6239" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Expenses" dataKey="totalExpenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Net Profit" dataKey="netProfit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No data available for Year {selectedYear}.
            </div>
          )}
        </div>
      </div>

      {/* Monthly Profit & Loss (P&L) Detail Table */}
      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Table Column */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem', overflowX: 'auto' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Monthly Balance Sheets - FY {selectedYear}
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem' }}>Month</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Gross Sales</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Discounts</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>GST Tax</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Net Rev</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Expenses</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Net Profit</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="skeleton" style={{ height: '24px', marginBottom: '0.5rem' }}></div>
                    <div className="skeleton" style={{ height: '24px' }}></div>
                  </td>
                </tr>
              ) : monthlyData.map(m => (
                <tr 
                  key={m.month} 
                  className="table-row-hover"
                  style={{ 
                    borderBottom: '1px solid var(--border)', 
                    fontSize: '0.9rem',
                    backgroundColor: selectedMonthIndex === m.monthIndex ? 'rgba(140, 98, 57, 0.08)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{m.month}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{m.grossRevenue.toFixed(0)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--error)' }}>-₹{m.discounts.toFixed(0)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{m.gstCollected.toFixed(0)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>₹{m.netRevenue.toFixed(0)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{m.totalExpenses.toFixed(0)}</td>
                  <td style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    fontWeight: 'bold',
                    color: m.netProfit >= 0 ? '#10b981' : '#ef4444' 
                  }}>
                    {m.netProfit >= 0 ? '+' : ''}₹{m.netProfit.toFixed(0)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => fetchDailyReports(m.monthIndex)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', float: 'right' }}
                    >
                      <Eye size={12} /> Drilldown
                    </button>
                  </td>
                </tr>
              ))}
              {monthlyData.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Daily drilldown chart Column */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} color="var(--primary)" /> Daily Drilldown Panel
          </h3>

          {selectedMonthIndex === null ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Click "Drilldown" on any month in the table to view the daily revenue breakdown.
            </div>
          ) : isDailyLoading ? (
            <div className="skeleton" style={{ flex: 1 }}></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontWeight: 'bold' }}>{getSelectedMonthName()} Daily Revenue</h4>
                <button 
                  onClick={() => { setSelectedMonthIndex(null); setDailyData([]); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  Clear Panel
                </button>
              </div>

              <div style={{ height: '220px', width: '100%', flex: 1 }}>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: '0.75rem' }} />
                      <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: '0.75rem' }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8rem' }}
                      />
                      <Bar name="Revenue" dataKey="revenue" fill="#8C6239" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No daily records found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Reports;
