import React, { useState, useEffect, useContext, useRef } from 'react';
import { ToastContext } from '../App';
import { jsPDF } from 'jspdf';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Phone, 
  Tag, 
  Printer, 
  Download, 
  Share2, 
  Coffee, 
  Compass,
  CreditCard,
  Percent,
  CheckCircle,
  HelpCircle,
  FileText,
  ShoppingCart
} from 'lucide-react';

const POS = ({ auth }) => {
  const { showToast } = useContext(ToastContext);
  
  // Data State
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Cart State
  const [cart, setCart] = useState([]);
  
  // Customer & Billing details
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [orderType, setOrderType] = useState('takeaway'); // dine_in, takeaway, delivery
  const [tableNumber, setTableNumber] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountOptions, setDiscountOptions] = useState(() => {
    const saved = localStorage.getItem('discountConfig');
    return saved ? JSON.parse(saved) : [0, 5, 10, 15, 20];
  });
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, upi, card
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');
  
  // Post-Checkout State (Receipt Generator Modal)
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Categories list mapped from requirements
  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'hot_coffee', label: 'Hot Coffee' },
    { value: 'cold_coffee', label: 'Cold Coffee' },
    { value: 'frappuccino', label: 'Frappuccino' },
    { value: 'soda', label: 'Sodas' },
    { value: 'light_bites', label: 'Light Bites' },
    { value: 'savoury_bites', label: 'Savoury Bites' }
  ];

  // 1. Fetch Menu Items
  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMenuItems(data);
      } else {
        showToast(data.message || 'Failed to fetch menu', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // 2. Real-time Customer Phone Lookup Suggestions
  useEffect(() => {
    const lookupCustomer = async () => {
      if (customerPhone.length === 10) {
        try {
          const res = await fetch(`/api/customers/phone/${customerPhone}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          const data = await res.json();
          if (res.ok && data) {
            setCustomerName(data.name);
            setIsNewCustomer(false);
            showToast(`VIP Customer ${data.name} identified! Visits: ${data.totalVisits || 0}`, 'success');
          } else {
            setIsNewCustomer(true);
          }
        } catch (err) {
          // ignore lookup errors
        }
      }
    };
    lookupCustomer();
  }, [customerPhone]);

  // 3. Cart Functions
  const addToCart = (item) => {
    if (!item.isAvailable) {
      showToast(`${item.name} is currently out of stock!`, 'warning');
      return;
    }

    const savedGst = localStorage.getItem('gstConfig');
    const gstConfig = savedGst ? JSON.parse(savedGst) : {};
    const finalGstPercent = gstConfig[item.category] !== undefined ? Number(gstConfig[item.category]) : (item.gstPercent || 5.0);

    setCart(prev => {
      const idx = prev.findIndex(cartItem => cartItem._id === item._id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      } else {
        return [...prev, {
          _id: item._id,
          name: item.name,
          price: item.price,
          gstPercent: finalGstPercent,
          quantity: 1
        }];
      }
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item._id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  // 4. POS Pricing Math Calculations
  const calculateCart = () => {
    let subtotal = 0;
    let totalGst = 0;

    cart.forEach(item => {
      const price = Number(item.price);
      const qty = Number(item.quantity);
      subtotal += price * qty;
      totalGst += (price * qty) * ((item.gstPercent || 5.0) / 100);
    });

    const discountAmount = subtotal * (Number(discountPercent) / 100);
    const grandTotal = subtotal + totalGst - discountAmount;
    const changeToReturn = paymentMethod === 'cash' && amountReceived 
      ? Math.max(0, Number(amountReceived) - grandTotal) 
      : 0;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalGst: Number(totalGst.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      changeToReturn: Number(changeToReturn.toFixed(2))
    };
  };

  const totals = calculateCart();

  // 5. Place POS Order Checkouts
  const handleCheckout = async (e, autoPrint = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (cart.length === 0) {
      showToast('Cart is empty', 'warning');
      return;
    }

    if (orderType === 'dine_in' && !tableNumber) {
      showToast('Please enter a Table Number for dine-in order', 'warning');
      return;
    }

    if (paymentMethod === 'cash' && (!amountReceived || Number(amountReceived) < totals.grandTotal)) {
      showToast('Amount received must be at least equal to Grand Total', 'warning');
      return;
    }

    setCheckoutLoading(true);

    const payload = {
      items: cart.map(i => ({ menuItemId: i._id, quantity: i.quantity })),
      orderType,
      tableNumber: orderType === 'dine_in' ? Number(tableNumber) : null,
      discountPercent: Number(discountPercent),
      notes,
      paymentMethod,
      paymentStatus: 'paid', // POS orders are paid immediately
      amountReceived: paymentMethod === 'cash' ? Number(amountReceived) : totals.grandTotal,
      customerName: customerName || null,
      customerPhone: customerPhone || null
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Order placed successfully! ID: ${data.orderCode}`, 'success');
        setActiveReceipt(data);
        setShowReceiptModal(true);
        
        // Reset POS state
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setTableNumber('');
        setDiscountPercent(0);
        setAmountReceived('');
        setNotes('');

        if (autoPrint) {
          setTimeout(() => {
            printThermalBill(data);
          }, 100);
        }
      } else {
        showToast(data.message || 'Checkout failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // 6. Thermal Receipt Roll Auto-Printer View
  const printThermalBill = (receipt = null) => {
    const r = receipt || activeReceipt;
    if (!r) return;

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      showToast('Could not open print window. Please allow popups.', 'error');
      return;
    }

    const itemsHtml = r.items.map(item => {
      const name = item.menuItem ? item.menuItem.name : 'Coffee Item';
      const displayName = name.length > 20 ? name.substring(0, 18) + '..' : name;
      const price = Number(item.unitPrice || item.price || 0).toFixed(2);
      const total = Number(item.subtotal || (item.quantity * (item.unitPrice || item.price || 0))).toFixed(2);
      return `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <div style="width: 50%;">${displayName}</div>
          <div style="width: 10%; text-align: center;">${item.quantity}</div>
          <div style="width: 20%; text-align: right;">${price}</div>
          <div style="width: 20%; text-align: right;">${total}</div>
        </div>
      `;
    }).join('');

    const discountRow = Number(r.discountAmount) > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Discount (${r.discountPercent}%):</span>
        <span>-₹${Number(r.discountAmount).toFixed(2)}</span>
      </div>
    ` : '';

    const cashRow = r.paymentMethod === 'cash' ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Received:</span>
        <span>₹${Number(r.amountReceived || r.grandTotal).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Change:</span>
        <span>₹${Number(r.changeToReturn || 0).toFixed(2)}</span>
      </div>
    ` : '';

    const customerRow = r.customer ? `
      <div style="margin-bottom: 4px;">Guest: ${r.customer.name} (${r.customer.phone})</div>
    ` : (r.customerPhone ? `<div style="margin-bottom: 4px;">Guest: ${r.customerName || 'Walk-in'} (${r.customerPhone})</div>` : '');

    const tableRow = r.tableNumber ? `
      <span>Table: #${r.tableNumber}</span>
    ` : '';

    const htmlContent = `
      <html>
        <head>
          <title>Thermal Bill - ${r.orderCode}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              width: 74mm;
              margin: 0 auto;
              padding: 5mm 2mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .bold { font-weight: bold; }
            .header-title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="header-title">CRFTD COFFEE SHOP</div>
            <div style="font-size: 9px; margin-bottom: 2px;">101 Gourmet Lane, Coffee Hills, IN</div>
            <div style="font-size: 9px; margin-bottom: 2px;">Phone: +91 98765 43210</div>
            <div style="font-size: 9px;">GSTIN: 29AAAAA1111A1Z1</div>
          </div>
          
          <div class="divider"></div>
          
          <div style="font-size: 10px; margin-bottom: 3px;">
            <div class="bold">Order: ${r.orderCode}</div>
            <div>Date: ${new Date(r.createdAt || Date.now()).toLocaleString()}</div>
            <div style="display: flex; justify-content: space-between;">
              <span>Type: ${(r.orderType || 'takeaway').toUpperCase()}</span>
              ${tableRow}
            </div>
            ${customerRow}
          </div>
          
          <div class="divider"></div>
          
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
            <div style="width: 50%;">Item</div>
            <div style="width: 10%; text-align: center;">Qty</div>
            <div style="width: 20%; text-align: right;">Price</div>
            <div style="width: 20%; text-align: right;">Total</div>
          </div>
          
          <div class="divider"></div>
          
          ${itemsHtml}
          
          <div class="divider"></div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Subtotal:</span>
            <span>₹${Number(r.subtotal).toFixed(2)}</span>
          </div>
          
          ${discountRow}
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>GST (5%):</span>
            <span>₹${Number(r.gstAmount || r.gstTotal || (r.subtotal * 0.05)).toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 4px; margin-bottom: 4px;">
            <span>GRAND TOTAL:</span>
            <span>₹${Number(r.grandTotal).toFixed(2)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div style="font-size: 10px; margin-bottom: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Payment:</span>
              <span class="bold">${(r.paymentMethod || 'cash').toUpperCase()} (${(r.paymentStatus || 'paid').toUpperCase()})</span>
            </div>
            ${cashRow}
          </div>
          
          <div class="divider"></div>
          
          <div class="center" style="font-size: 10px; font-weight: bold; margin-top: 10px; margin-bottom: 2px;">
            THANK YOU FOR YOUR VISIT!
          </div>
          <div class="center" style="font-size: 8px;">
            Brewed with Love. Powered by CRFTD POS.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 6b. Thermal PDF Generator (jsPDF) using Coffee Shop Theme Palette
  const generatePDF = () => {
    if (!activeReceipt) return;
    const r = activeReceipt;

    // Create a 80mm thermal receipt width format [80mm, 200mm] -> converted to points
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 220]
    });

    doc.setFont('Helvetica', 'normal');
    
    // Header Cafe Letterhead details
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('CRFTD COFFEE SHOP', 40, 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text('101 Gourmet Lane, Coffee Hills, IN', 40, 16, { align: 'center' });
    doc.text('Phone: +91 98765 43210  |  GSTIN: 29AAAAA1111A1Z1', 40, 19, { align: 'center' });
    
    doc.line(5, 22, 75, 22); // dashed divider line

    // Ticket metadata info
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Order: ${r.orderCode}`, 5, 27);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${new Date(r.createdAt).toLocaleString()}`, 5, 31);
    doc.text(`Type: ${r.orderType?.toUpperCase()}`, 5, 35);
    if (r.tableNumber) doc.text(`Table: #${r.tableNumber}`, 50, 35);
    
    if (r.customer) {
      doc.text(`Guest: ${r.customer.name} (${r.customer.phone})`, 5, 39);
    }

    doc.line(5, 42, 75, 42); // divider

    // Itemized table header columns
    doc.setFont('Helvetica', 'bold');
    doc.text('Item Description', 5, 46);
    doc.text('Qty', 45, 46);
    doc.text('Price', 53, 46);
    doc.text('Total', 67, 46);
    
    doc.line(5, 48, 75, 48); // divider
    
    // Render product items
    doc.setFont('Helvetica', 'normal');
    let y = 52;
    r.items.forEach(item => {
      const name = item.menuItem ? item.menuItem.name : 'Coffee Item';
      // Truncate name if too long
      const displayName = name.length > 20 ? name.substring(0, 18) + '..' : name;
      
      doc.text(displayName, 5, y);
      doc.text(String(item.quantity), 46, y);
      doc.text(String(Number(item.unitPrice).toFixed(1)), 53, y);
      doc.text(String(Number(item.subtotal).toFixed(1)), 67, y);
      y += 5;
    });

    doc.line(5, y, 75, y); // divider
    y += 4;

    // Billing Totals summary
    doc.text('Subtotal:', 40, y);
    doc.text(String(Number(r.subtotal).toFixed(2)), 67, y);
    y += 4;

    if (Number(r.discountAmount) > 0) {
      doc.text(`Discount (${r.discountPercent}%):`, 40, y);
      doc.text(`-${Number(r.discountAmount).toFixed(2)}`, 67, y);
      y += 4;
    }

    doc.text('GST (5% Collected):', 40, y);
    doc.text(String(Number(r.gstAmount).toFixed(2)), 67, y);
    y += 5;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('GRAND TOTAL:', 35, y);
    doc.text(`INR ${Number(r.grandTotal).toFixed(2)}`, 67, y);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    y += 5;

    doc.line(5, y, 75, y); // divider
    y += 4;

    doc.text(`Payment: ${r.paymentMethod?.toUpperCase()} (${r.paymentStatus?.toUpperCase()})`, 5, y);
    y += 4;
    if (r.paymentMethod === 'cash') {
      doc.text(`Received: ${Number(r.amountReceived).toFixed(2)} | Change: ${Number(r.changeToReturn).toFixed(2)}`, 5, y);
      y += 5;
    }

    // Thank you message
    doc.setFont('Helvetica', 'bold');
    doc.text('THANK YOU FOR YOUR VISIT!', 40, y, { align: 'center' });
    y += 4;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Brewed with Love. Powered by CRFTD POS.', 40, y, { align: 'center' });

    doc.save(`Bill_${r.orderCode}.pdf`);
    showToast('Bill PDF downloaded!', 'success');
  };

  // 7. Share on WhatsApp clicked
  const handleWhatsAppShare = () => {
    if (!activeReceipt) return;
    const r = activeReceipt;
    const itemsSummary = r.items.map(i => `${i.menuItem ? i.menuItem.name : 'Coffee'} (x${i.quantity})`).join(', ');
    const text = `*CRFTD COFFEE SHOP RECEIPT*\n\n*Order Code:* ${r.orderCode}\n*Date:* ${new Date(r.createdAt).toLocaleDateString()}\n*Items:* ${itemsSummary}\n*Grand Total:* ₹${Number(r.grandTotal).toFixed(2)}\n*Payment Mode:* ${r.paymentMethod.toUpperCase()}\n\nThank you for dining with us! Come back soon! ☕`;
    
    const phone = r.customer ? r.customer.phone : '';
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    
    // Open web.whatsapp link
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filter menu items by selected category and search input
  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' ? true : item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '90vh', overflow: 'hidden' }} className="mobile-stack">
      
      {/* LEFT PANEL: Menu Cards Group Grid */}
      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Search and Filters Header */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search coffee or snack code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.75rem', height: '2.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-panel)' }}
            />
          </div>

          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '180px', height: '2.75rem', padding: '0 1rem', background: 'var(--bg-panel)', borderRadius: 'var(--radius-md)' }}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Categories Tab Pill Bar */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '0.85rem',
          marginBottom: '1rem',
          flexShrink: 0
        }} className="custom-scroll">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '30px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)',
                backgroundColor: selectedCategory === cat.value ? 'var(--primary)' : 'var(--bg-panel)',
                color: selectedCategory === cat.value ? 'white' : 'var(--text-muted)'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu Grid scroll frame */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scroll">
          {loadingMenu ? (
            <div className="pos-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
              <Coffee size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No coffee or bites found in this category.</p>
            </div>
          ) : (
            <div className="pos-grid">
              {filteredMenu.map(item => (
                <div 
                  key={item._id} 
                  className="pos-item-card"
                  onClick={() => addToCart(item)}
                  style={{
                    opacity: item.isAvailable ? 1 : 0.6,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Availability Badge Overlay */}
                  {!item.isAvailable && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: 'var(--error)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '10px',
                      zIndex: 2
                    }}>
                      Out of stock
                    </div>
                  )}

                  {/* Product Image */}
                  <div style={{
                    width: '100%',
                    height: '110px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--border-light)',
                    position: 'relative'
                  }}>
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)' }}>
                        <Coffee size={36} />
                      </div>
                    )}
                  </div>

                  <span className="pos-item-name">{item.name}</span>
                  <span className="pos-item-category">{item.category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  <span className="pos-item-price">₹{Number(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CART SIDEBAR */}
      <div className="cart-sidebar" style={{ height: '90vh', borderRadius: 'var(--radius-xl)' }}>
        
        {/* Cart Header */}
        <div className="cart-header" style={{ flexShrink: 0 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={20} color="var(--primary)" /> Cart Register
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {cart.length} distinct item(s) selected
          </span>
        </div>

        {/* Cart Items List */}
        <div className="cart-items custom-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)', textAlign: 'center' }}>
              <Coffee size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>Cart is empty.<br />Click coffee cards to add.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', display: 'block' }}>{item.name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{Number(item.price).toFixed(2)}</span>
                </div>
                
                {/* Quantity adjustments +/- */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 1rem' }}>
                  <button 
                    onClick={() => updateQuantity(item._id, -1)}
                    style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item._id, 1)}
                    style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Remove Trash icon */}
                <button 
                  onClick={() => removeFromCart(item._id)}
                  style={{ background: 'transparent', border: 'none', color: '#d9534f', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Billing Footer Renders calculations */}
        <div className="cart-footer" style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-panel)', padding: '1rem' }}>
          
          <form onSubmit={handleCheckout} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            
            {/* Customer Lookup phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Phone size={14} color="var(--text-subtle)" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  maxLength={10}
                  placeholder="Phone number" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ padding: '0.4rem 0.5rem 0.4rem 1.75rem', height: '2rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <User size={14} color="var(--text-subtle)" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Guest name" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={!isNewCustomer && customerPhone.length === 10}
                  style={{ padding: '0.4rem 0.5rem 0.4rem 1.75rem', height: '2rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
            </div>

            {/* Order types and table number */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {['dine_in', 'takeaway'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    style={{
                      flex: 1,
                      border: 'none',
                      height: '1.8rem',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      background: orderType === type ? 'var(--primary)' : 'transparent',
                      color: orderType === type ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    {type === 'dine_in' ? 'Dine In' : 'Takeaway'}
                  </button>
                ))}
              </div>

              {orderType === 'dine_in' ? (
                <input 
                  type="number" 
                  min="1"
                  required
                  placeholder="Table #" 
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  style={{ padding: '0.2rem 0.5rem', height: '1.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                />
              ) : (
                <div style={{ height: '1.8rem' }} />
              )}
            </div>

            {/* Discount and Payment Method selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Percent size={14} color="var(--text-subtle)" />
                <select 
                  value={discountPercent} 
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  style={{ height: '2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                >
                  {discountOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}% Disc</option>
                  ))}
                </select>
              </div>

              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ height: '2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="cash">💵 Cash Pay</option>
                <option value="upi">📱 UPI Pay</option>
                <option value="card">💳 Card Pay</option>
              </select>
            </div>

            {/* Cash Received and change return controls */}
            {paymentMethod === 'cash' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  min={totals.grandTotal}
                  placeholder="Tender Cash" 
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  style={{ padding: '0.2rem 0.5rem', height: '2rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                />
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                  Change: <span style={{ color: 'var(--primary)' }}>₹{totals.changeToReturn.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Order Totals Summary */}
            <div style={{ margin: '0.25rem 0' }}>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="summary-row" style={{ color: '#d9534f' }}>
                  <span>Discount</span>
                  <span>-₹{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>GST (5%)</span>
                <span>₹{totals.totalGst.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>GRAND TOTAL</span>
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit checkout buttons in grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn btn-secondary" 
                style={{ width: '100%', height: '2.6rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: '700' }}
                disabled={checkoutLoading || cart.length === 0}
              >
                {checkoutLoading ? '...' : 'Place Order'}
              </button>
              
              <button 
                type="button" 
                onClick={() => handleCheckout(null, true)}
                className="btn btn-primary" 
                style={{ width: '100%', height: '2.6rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', justifyContent: 'center', fontWeight: '700' }}
                disabled={checkoutLoading || cart.length === 0}
              >
                {checkoutLoading ? '...' : 'Generate & Print'}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* TICKET RECEIPT MODAL SHEET (MODULE 5) */}
      {showReceiptModal && activeReceipt && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass" style={{
            width: '380px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={44} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Transaction Logged</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order ID: {activeReceipt.orderCode}</p>
            </div>

            {/* Small scrollable bill sheet mock */}
            <div style={{ 
              background: 'var(--border-light)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.25rem', 
              fontSize: '0.8rem',
              border: '1px dashed var(--border)',
              maxHeight: '260px',
              overflowY: 'auto'
            }} className="custom-scroll">
              <div style={{ textAlign: 'center', fontWeight: '800', marginBottom: '0.5rem' }}>CRFTD COFFEE SHOP</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                <span>Code: {activeReceipt.orderCode}</span>
                <span>{new Date(activeReceipt.createdAt).toLocaleDateString()}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '0.5rem 0' }} />
              
              {activeReceipt.items.map((i, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', margin: '0.25rem 0' }}>
                  <span>{i.menuItem ? i.menuItem.name : 'Coffee'} x{i.quantity}</span>
                  <span>₹{Number(i.subtotal).toFixed(2)}</span>
                </div>
              ))}
              
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>Subtotal</span>
                <span>₹{Number(activeReceipt.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>GST (5%)</span>
                <span>₹{Number(activeReceipt.gstAmount).toFixed(2)}</span>
              </div>
              {Number(activeReceipt.discountAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#d9534f' }}>
                  <span>Discount</span>
                  <span>-₹{Number(activeReceipt.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                <span>GRAND TOTAL</span>
                <span>₹{Number(activeReceipt.grandTotal).toFixed(2)}</span>
              </div>
            </div>

            {/* Bill Actions buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={generatePDF}
                className="btn btn-primary"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.85rem' }}
              >
                <Download size={16} /> Download Bill PDF
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button 
                  onClick={() => printThermalBill(activeReceipt)}
                  className="btn btn-secondary"
                  style={{ height: '2.5rem', fontSize: '0.85rem' }}
                >
                  <Printer size={16} /> Print Bill
                </button>
                <button 
                  onClick={handleWhatsAppShare}
                  className="btn btn-secondary"
                  style={{ height: '2.5rem', fontSize: '0.85rem', color: '#25D366' }}
                >
                  <Share2 size={16} /> WhatsApp
                </button>
              </div>

              <button 
                onClick={() => setShowReceiptModal(false)}
                className="btn btn-secondary"
                style={{ width: '100%', height: '2.5rem', marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: '700' }}
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POS;
