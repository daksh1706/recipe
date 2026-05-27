import React, { useState, useEffect, useContext, useMemo } from 'react';
import { FileText, Search, User, CreditCard, Calendar, ChevronLeft, ChevronRight, Download, X, Eye, Filter, Printer, Share2, ShieldAlert } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ToastContext } from '../App';

const OrderLedger = () => {
  const { showToast } = useContext(ToastContext);
  
  // State variables
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  
  // Drawer & pagination
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 20;

  // Retrieve store profile details from localStorage for receipt generation
  const storeDetails = useMemo(() => {
    const saved = localStorage.getItem('storeDetails');
    return saved ? JSON.parse(saved) : {
      name: 'CRFTD Coffee House',
      gstin: '27CRFTD0000A1Z5',
      address: 'Premium Crafted Experience, 123 Espresso Avenue',
      phone: '9876543210',
      email: 'contact@crftdcoffee.com',
      logoUrl: ''
    };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, typeFilter, paymentFilter, startDate, endDate, selectedStaffId, searchTerm]);

  const fetchOrders = async () => {
    setIsRefreshing(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (paymentFilter) params.append('payment', paymentFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedStaffId) params.append('staff', selectedStaffId);
      if (searchTerm) params.append('search', searchTerm);

      const auth = JSON.parse(localStorage.getItem('userInfo')) || {};
      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        showToast('Failed to load ledger records', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading ledger', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateOrderStatusInLedger = async (id, newStatus, orderCode) => {
    try {
      const auth = JSON.parse(localStorage.getItem('userInfo')) || {};
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        showToast(`Order ${orderCode} updated to '${newStatus}'!`);
        fetchOrders();
        // Update selected order in side drawer
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder(updated);
        }
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update order status', 'error');
      }
    } catch (err) {
      showToast('Network error updating status', 'error');
    }
  };

  // Compile unique staff members locally for dropdown filter
  const staffList = useMemo(() => {
    const staffMap = {};
    orders.forEach(o => {
      if (o.staff) {
        staffMap[o.staff.id] = o.staff.full_name || o.staff.email;
      }
    });
    return Object.entries(staffMap).map(([id, name]) => ({ id, name }));
  }, [orders]);

  // Pagination slicing
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return orders.slice(startIndex, startIndex + itemsPerPage);
  }, [orders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));

  // CSV Exporter
  const handleExportCSV = () => {
    try {
      const headers = ['Order Code', 'Date & Time', 'Customer Name', 'Phone', 'Order Type', 'Subtotal', 'Discount Amount', 'GST Amount', 'Grand Total', 'Payment Method', 'Status', 'Staff Member'];
      const rows = orders.map(o => [
        o.orderCode || o.order_code || '',
        new Date(o.createdAt).toLocaleString('en-IN'),
        o.customer?.name || 'Walk-in Customer',
        o.customer?.phone ? `'${o.customer.phone}` : '',
        o.orderType || o.order_type || '',
        o.subtotal || 0,
        o.discountAmount || 0,
        o.gstAmount || 0,
        o.grandTotal || 0,
        o.paymentMethod || '',
        o.status || '',
        o.staff?.full_name || o.staff?.email || 'N/A'
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', encodedUri);
      downloadAnchor.setAttribute('download', `crftd_orders_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Ledger exported to CSV!');
    } catch (err) {
      console.error(err);
      showToast('Failed to export CSV', 'error');
    }
  };

  // jsPDF Printable Receipt Generator
  const generateReceiptDoc = (order) => {
    // Standard thermal 80mm roll width. Height dynamically long to prevent truncating.
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 240]
    });

    doc.setFont('courier', 'normal');
    doc.setFontSize(8); 
    
    let y = 10;
    const marginLeft = 4;
    
    const doubleLine = "==========================================";
    const singleLine = "------------------------------------------";

    // Store letterhead header
    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.text(storeDetails.name.toUpperCase().padStart(22, ' '), marginLeft, y);
    y += 5;
    
    doc.setFontSize(7.5);
    doc.setFont('courier', 'normal');
    const addrLines = doc.splitTextToSize(storeDetails.address, 72);
    addrLines.forEach(line => {
      doc.text(line, marginLeft, y);
      y += 3.5;
    });
    
    doc.text(`Phone: +91 ${storeDetails.phone}`, marginLeft, y);
    y += 3.5;
    doc.text(`GSTIN: ${storeDetails.gstin}`, marginLeft, y);
    y += 4.5;
    
    doc.text(doubleLine, marginLeft, y);
    y += 4;

    const orderNo = order.orderCode || order.order_code || 'ORD-0000';
    const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    const billNo = `BILL-${orderNo.replace('ORD-', '')}`;
    const tokenNo = orderNo.replace('ORD-', '');
    doc.text(`Bill No   : ${billNo}`, marginLeft, y);
    y += 3.5;
    doc.text(`Order Code: ${orderNo} (Token: ${tokenNo})`, marginLeft, y);
    y += 3.5;
    doc.text(`Date      : ${dateStr}`, marginLeft, y);
    y += 3.5;
    doc.text(`Order Type: ${(order.orderType || 'takeaway').toUpperCase()}`, marginLeft, y);
    y += 3.5;
    if (order.tableNumber) {
      doc.text(`Table No  : Table ${order.tableNumber}`, marginLeft, y);
      y += 3.5;
    }
    
    const cName = order.customer?.name || 'Walk-in Customer';
    doc.text(`Customer  : ${cName}`, marginLeft, y);
    y += 3.5;
    if (order.customer?.phone) {
      doc.text(`Cust Phone: +91 ${order.customer.phone}`, marginLeft, y);
      y += 3.5;
    }

    doc.text(singleLine, marginLeft, y);
    y += 4;

    doc.setFont('courier', 'bold');
    doc.text("Item                    Qty  Price   Total", marginLeft, y);
    y += 3.5;
    doc.setFont('courier', 'normal');
    doc.text(singleLine, marginLeft, y);
    y += 4;

    const padR = (str, len) => str.toString().padEnd(len, ' ');
    const padL = (str, len) => str.toString().padStart(len, ' ');

    order.items?.forEach(item => {
      let itemName = item.menuItem?.name || 'Coffee Item';
      if (itemName.length > 21) {
        itemName = itemName.substring(0, 20) + '.';
      }
      
      const col1 = padR(itemName, 22);
      const col2 = padL(item.quantity.toString(), 3);
      const col3 = padL((item.unitPrice || item.priceAtTime || 0).toFixed(2), 7);
      const col4 = padL((item.subtotal || 0).toFixed(2), 8);
      
      doc.text(`${col1}${col2}${col3}${col4}`, marginLeft, y);
      y += 4;
    });

    doc.text(singleLine, marginLeft, y);
    y += 4;

    const subtotalStr = (order.subtotal || 0).toFixed(2);
    doc.text(`Subtotal:                        ${padL(subtotalStr, 8)}`, marginLeft, y);
    y += 4;
    
    if (order.discountAmount > 0) {
      const discountStr = order.discountAmount.toFixed(2);
      doc.text(`Discount (${order.discountPercent || 0}%):                 -${padL(discountStr, 8)}`, marginLeft, y);
      y += 4;
    }

    const gstStr = (order.gstAmount || order.taxAmount || 0).toFixed(2);
    doc.text(`GST collected:                   ${padL(gstStr, 8)}`, marginLeft, y);
    y += 4;

    doc.text(doubleLine, marginLeft, y);
    y += 4;

    doc.setFont('courier', 'bold');
    const grandStr = (order.grandTotal || order.totalAmount || 0).toFixed(2);
    doc.text(`GRAND TOTAL (INR):               ${padL(grandStr, 8)}`, marginLeft, y);
    doc.setFont('courier', 'normal');
    y += 4.5;

    doc.text(`Payment Method: ${(order.paymentMethod || 'Cash').toUpperCase()}`, marginLeft, y);
    y += 3.5;
    doc.text(`Payment Status: ${(order.paymentStatus || 'Paid').toUpperCase()}`, marginLeft, y);
    y += 3.5;

    if ((order.paymentMethod || '').toLowerCase() === 'cash' && order.amountReceived) {
      const receivedStr = Number(order.amountReceived).toFixed(2);
      const returnStr = Number(order.changeToReturn || 0).toFixed(2);
      doc.text(`Amount Received:                  ${padL(receivedStr, 8)}`, marginLeft, y);
      y += 3.5;
      doc.text(`Change Returned:                  ${padL(returnStr, 8)}`, marginLeft, y);
      y += 4.5;
    }

    doc.text(doubleLine, marginLeft, y);
    y += 5;

    doc.text("        Thank you! Please visit again.", marginLeft, y);
    y += 4;
    doc.text("        System Powered by CRFTD POS", marginLeft, y);
    y += 4;
    doc.text(doubleLine, marginLeft, y);

    return doc;
  };

  const handleDownloadReceipt = (order) => {
    try {
      const doc = generateReceiptDoc(order);
      const orderNo = order.orderCode || order.order_code || 'ORD-0000';
      doc.save(`bill_${orderNo}.pdf`);
      showToast(`Bill PDF saved for order ${orderNo}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to compile receipt PDF', 'error');
    }
  };

  const handlePrintReceipt = (order) => {
    try {
      const doc = generateReceiptDoc(order);
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
      showToast('Triggered printer roll stream!');
    } catch (err) {
      console.error(err);
      showToast('Error opening print stream', 'error');
    }
  };

  const handleWhatsAppReceipt = (order) => {
    if (!order.customer?.phone) {
      showToast('No phone number registered for customer!', 'warning');
      return;
    }
    const phone = order.customer.phone;
    const name = order.customer.name;
    const orderNo = order.orderCode || order.order_code || 'ORD-0000';
    const total = (order.grandTotal || order.totalAmount || 0).toFixed(2);
    
    const message = `Hi ${name}, thank you for dining at ${storeDetails.name}! ☕\nYour order #${orderNo} has been processed.\nTotal Bill: Rs. ${total}\nPayment Method: ${order.paymentMethod?.toUpperCase()}\nWe look forward to serving you again! 😊`;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/91${phone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const getStatusBadgeStyle = (status) => {
    const rawStatus = (status || '').toLowerCase();
    switch (rawStatus) {
      case 'pending':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
      case 'preparing':
        return { backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#f97316' };
      case 'ready':
        return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      case 'served':
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      case 'cancelled':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
      default:
        return { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
      
      {/* Title & Actions Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Order Ledger</h1>
          <p style={{ color: 'var(--text-muted)' }}>Complete historical register of all coffee store transactions</p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          className="btn btn-secondary"
          style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={18} /> Export CSV Ledger
        </button>
      </div>

      {/* Advanced Query Filter Box */}
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
          <Filter size={16} color="var(--primary)" /> Advanced Filters & Query Controls
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Search Register</label>
            <input 
              type="text" 
              placeholder="Code, name, or phone..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', paddingLeft: '2.25rem' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', bottom: '0.65rem' }} />
          </div>

          {/* Status filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Order type filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Order Type</label>
            <select 
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Types</option>
              <option value="dine_in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          {/* Payment Method filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Payment Method</label>
            <select 
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          {/* Start Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Staff member */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Handled By (Staff)</label>
            <select 
              value={selectedStaffId}
              onChange={(e) => { setSelectedStaffId(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Staff</option>
              {staffList.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setPaymentFilter('');
                setStartDate('');
                setEndDate('');
                setSelectedStaffId('');
                setSearchTerm('');
                setCurrentPage(1);
                showToast('Ledger filters reset!');
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.6rem' }}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Ledger List Table */}
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '1.25rem' }}>Code</th>
                <th style={{ padding: '1.25rem' }}>Date & Time</th>
                <th style={{ padding: '1.25rem' }}>Customer Details</th>
                <th style={{ padding: '1.25rem' }}>Order Type</th>
                <th style={{ padding: '1.25rem' }}>Payment</th>
                <th style={{ padding: '1.25rem' }}>Status</th>
                <th style={{ padding: '1.25rem', textAlign: 'right' }}>Total (₹)</th>
                <th style={{ padding: '1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isRefreshing ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="skeleton" style={{ height: '30px', marginBottom: '0.75rem' }}></div>
                    <div className="skeleton" style={{ height: '30px', marginBottom: '0.75rem' }}></div>
                    <div className="skeleton" style={{ height: '30px' }}></div>
                  </td>
                </tr>
              ) : paginatedOrders.map(order => (
                <tr 
                  key={order._id} 
                  className="table-row-hover" 
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '1.25rem', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--primary)' }}>
                    #{order.orderCode || order.order_code || 'ORD-0000'}
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 500 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                      <User size={13} color="var(--text-muted)" />
                      {order.customer?.name || 'Walk-in Customer'}
                    </div>
                    {order.customer?.phone && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1.2rem', marginTop: '0.15rem' }}>
                        +91 {order.customer.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem', textTransform: 'capitalize' }}>
                    {order.orderType?.replace('_', ' ') || 'Takeaway'}
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CreditCard size={13} color="var(--text-muted)" />
                      <span style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}>{order.paymentMethod}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b', textTransform: 'capitalize' }}>
                      {order.paymentStatus}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold',
                      ...getStatusBadgeStyle(order.status)
                    }}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem' }}>
                    ₹{(order.grandTotal || order.totalAmount || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching order records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination navigation controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({orders.length} total orders)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Drawer Panel for Order Details */}
      {selectedOrder && (
        <>
          {/* Drawer backdrop screen */}
          <div 
            onClick={() => setSelectedOrder(null)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1010,
              backdropFilter: 'blur(3px)'
            }}
          />
          
          {/* Slide out drawer card container */}
          <div style={{
            position: 'fixed',
            top: 0, right: 0, bottom: 0,
            width: '100%',
            maxWidth: '480px',
            background: 'var(--bg-panel)',
            borderLeft: '1px solid var(--border)',
            boxShadow: 'var(--shadow-2xl)',
            zIndex: 1020,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideIn 0.3s ease-out',
            color: 'var(--text-main)'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 'bold' }}>
                  #{selectedOrder.orderCode || selectedOrder.order_code || 'ORD-0000'}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable details view */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Customer & Staff Info block */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Order Logistics</h4>
                <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.customer?.name || 'Walk-in Customer'}</strong>
                  </div>
                  {selectedOrder.customer?.phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                      <strong>+91 {selectedOrder.customer.phone}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Order Type:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{selectedOrder.orderType?.replace('_', ' ') || 'Takeaway'}</strong>
                  </div>
                  {selectedOrder.tableNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Table Number:</span>
                      <strong>Table {selectedOrder.tableNumber}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Handled By:</span>
                    <strong>{selectedOrder.staff?.full_name || selectedOrder.staff?.email || 'Counter Staff'}</strong>
                  </div>
                </div>
              </div>

              {/* Status workflow updater */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Change Order Status</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['pending', 'preparing', 'ready', 'served', 'cancelled'].map(st => {
                    const isActive = (selectedOrder.status || '').toLowerCase() === st;
                    return (
                      <button
                        key={st}
                        onClick={() => updateOrderStatusInLedger(selectedOrder._id, st, selectedOrder.orderCode)}
                        disabled={isActive}
                        className="btn"
                        style={{
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.8rem',
                          textTransform: 'capitalize',
                          background: isActive ? 'var(--primary)' : 'transparent',
                          color: isActive ? 'white' : 'var(--text-muted)',
                          borderColor: isActive ? 'var(--primary)' : 'var(--border)'
                        }}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Itemized list details */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Items Ordered</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.5rem 0', textAlign: 'left' }}>Menu Product</th>
                      <th style={{ padding: '0.5rem 0', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px dashed var(--border)' }}>
                        <td style={{ padding: '0.75rem 0' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.menuItem?.name || 'Item'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{(item.unitPrice || item.priceAtTime || 0).toFixed(2)} each</div>
                        </td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold' }}>₹{(item.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial summary calculations */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Bill Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--error)' }}>
                      <span>Discount ({selectedOrder.discountPercent || 0}%)</span>
                      <span>-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>GST Collected</span>
                    <span>₹{(selectedOrder.gstAmount || selectedOrder.taxAmount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--primary)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <span>Grand Total</span>
                    <span>₹{(selectedOrder.grandTotal || selectedOrder.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Print and Receipt buttons panel */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.1)' }}>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleDownloadReceipt(selectedOrder)}
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem' }}
                >
                  <Download size={16} /> PDF Bill
                </button>
                <button 
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem' }}
                >
                  <Printer size={16} /> Thermal Roll
                </button>
              </div>

              {selectedOrder.customer?.phone && (
                <button 
                  onClick={() => handleWhatsAppReceipt(selectedOrder)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.75rem', background: '#25D366', color: 'white', border: 'none' }}
                >
                  <Share2 size={16} /> Send via WhatsApp
                </button>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default OrderLedger;
