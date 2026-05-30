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
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Settings2,
  X
} from 'lucide-react';

const formatStock = (stock, unit) => {
  const num = Number(stock);
  if (isNaN(num)) return `${stock} ${unit}`;
  const lowerUnit = (unit || '').toLowerCase().trim();
  
  if (num >= 1000) {
    if (lowerUnit === 'ml') {
      return `${Number((num / 1000).toFixed(2))} L`;
    }
    if (lowerUnit === 'gm' || lowerUnit === 'g' || lowerUnit === 'grams') {
      return `${Number((num / 1000).toFixed(2))} Kg`;
    }
  }
  return `${stock} ${unit}`;
};

const getDrinkBaseName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\biced\b/gi, '')
    .replace(/\bcold\b/gi, '')
    .replace(/\bhot\b/gi, '')
    .replace(/\bwarm\b/gi, '')
    .replace(/\([^)]*\)/g, '') // remove parentheses text e.g., (Nutella Style)
    .replace(/[^a-zA-Z0-9\s]/g, '') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
};

const isColdItem = (name) => {
  const lower = (name || '').toLowerCase();
  return lower.includes('iced') || lower.includes('cold') || lower.includes('frappuccino') || lower.includes('frappe') || lower.includes('soda');
};

const sortMenuAdjacent = (items) => {
  const sorted = [];
  const processed = new Set();

  for (const item of items) {
    if (processed.has(item._id)) continue;

    const baseName = getDrinkBaseName(item.name);
    const itemIsCold = isColdItem(item.name);

    // Look for a counterpart in the rest of the items
    const counterpart = items.find(other => {
      if (other._id === item._id || processed.has(other._id)) return false;
      const otherBaseName = getDrinkBaseName(other.name);
      const otherIsCold = isColdItem(other.name);
      
      // Counterparts must have the same base flavor/name but different temperature states (one cold, one hot)
      return baseName === otherBaseName && (itemIsCold !== otherIsCold);
    });

    if (counterpart) {
      const hotItem = itemIsCold ? counterpart : item;
      const coldItem = itemIsCold ? item : counterpart;

      sorted.push(hotItem);
      sorted.push(coldItem);

      processed.add(hotItem._id);
      processed.add(coldItem._id);
    } else {
      sorted.push(item);
      processed.add(item._id);
    }
  }
  return sorted;
};

const getNutrition = (itemName = '') => {
  const name = itemName.toLowerCase();
  let calories = 120;
  let carbs = 15;
  let protein = 2;
  let fat = 3;

  if (name.includes('espresso')) {
    calories = 5;
    carbs = 0.5;
    protein = 0.3;
    fat = 0.1;
  } else if (name.includes('americano')) {
    calories = 10;
    carbs = 1;
    protein = 0.5;
    fat = 0.1;
  } else if (name.includes('latte') || name.includes('flat white')) {
    calories = 120;
    carbs = 12;
    protein = 7;
    fat = 5;
  } else if (name.includes('cappuccino')) {
    calories = 100;
    carbs = 10;
    protein = 6;
    fat = 4;
  } else if (name.includes('mocha')) {
    calories = 230;
    carbs = 28;
    protein = 8;
    fat = 9;
  } else if (name.includes('frappuccino') || name.includes('shake')) {
    calories = 310;
    carbs = 42;
    protein = 9;
    fat = 11;
  } else if (name.includes('soda')) {
    calories = 140;
    carbs = 35;
    protein = 0;
    fat = 0;
  } else if (name.includes('cupcake') || name.includes('cookie') || name.includes('brownie')) {
    calories = 280;
    carbs = 38;
    protein = 4;
    fat = 12;
  } else if (name.includes('pasta')) {
    calories = 420;
    carbs = 54;
    protein = 14;
    fat = 16;
  } else if (name.includes('sandwich')) {
    calories = 350;
    carbs = 32;
    protein = 15;
    fat = 14;
  }

  if (name.includes('caramel') || name.includes('vanilla') || name.includes('hazelnut') || name.includes('toffee')) {
    calories += 50;
    carbs += 12;
  }

  return { calories, carbs, protein, fat };
};

const POS = ({ auth }) => {
  const { showToast } = useContext(ToastContext);
  
  // Retrieve store profile details from localStorage for receipt generation
  const storeDetails = (() => {
    try {
      const saved = localStorage.getItem('storeDetails');
      return saved ? JSON.parse(saved) : {
        name: 'CRFTD Coffee House',
        gstin: '27CRFTD0000A1Z5',
        address: 'Premium Crafted Experience, 123 Espresso Avenue',
        phone: '9876543210',
        email: 'contact@crftdcoffee.com',
        logoUrl: ''
      };
    } catch {
      return {
        name: 'CRFTD Coffee House',
        gstin: '27CRFTD0000A1Z5',
        address: 'Premium Crafted Experience, 123 Espresso Avenue',
        phone: '9876543210',
        email: 'contact@crftdcoffee.com',
        logoUrl: ''
      };
    }
  })();
  
  // Data State
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  
  // Build Your Own Customization Modal
  const [custModal, setCustModal] = useState(null); // { item, step, selections }
  
  // Customization categories in order
  const CUST_CATEGORIES = [
    { key: 'milk',          label: 'Milk Type',        emoji: '🥛', multi: false },
    { key: 'syrups',        label: 'Syrups',           emoji: '🍯', multi: true },
    { key: 'coffee_beans',  label: 'Coffee Shot',      emoji: '☕', multi: false },
  ];
  
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
    { value: 'espresso', label: 'Espresso' },
    { value: 'latte', label: 'Latte' },
    { value: 'cappuccino', label: 'Cappuccino' },
    { value: 'mocha', label: 'Mocha' },
    { value: 'americano', label: 'Americano' },
    { value: 'flat_white', label: 'Flat White' },
    { value: 'macchiato', label: 'Macchiato' },
    { value: 'frappuccino', label: 'Frappuccino' },
    { value: 'cold_brew', label: 'Cold Brews' },
    { value: 'soda', label: 'Sodas & Cold Drinks' },
    { value: 'light_bites', label: 'Light Bites' },
    { value: 'pasta', label: 'Pasta' }
  ];

  // 1. Fetch Menu Items — with auto-retry only for server/network errors (not auth errors)
  const fetchMenu = async (attempt = 1) => {
    setLoadingMenu(true);
    // Read token fresh from localStorage each time — most reliable source
    const token = (() => {
      try { return JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''; }
      catch { return ''; }
    })();

    if (!token) {
      // No token at all — user not logged in, don't spam requests
      setLoadingMenu(false);
      return;
    }

    try {
      const res = await fetch('/api/menu', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
        setLoadingMenu(false);
      } else if (res.status === 401 || res.status === 403) {
        // Auth error — never retry, token is bad
        showToast('Session expired — please log out and log back in.', 'error');
        setLoadingMenu(false);
      } else if (res.status >= 500 && attempt < 4) {
        // Server error — retry (Render cold start returns 502/503)
        setTimeout(() => fetchMenu(attempt + 1), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || `Server error (${res.status}). Tap Retry.`, 'error');
        setLoadingMenu(false);
      }
    } catch (err) {
      // Network error / timeout — retry
      if (attempt < 4) {
        setTimeout(() => fetchMenu(attempt + 1), 3000);
      } else {
        showToast('Cannot reach server. Check connection and tap Retry.', 'error');
        setLoadingMenu(false);
      }
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchRawMaterials();
  }, []);

  // Fetch raw materials for customization options
  const fetchRawMaterials = async () => {
    try {
      const token = (() => {
        try { return JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''; }
        catch { return ''; }
      })();
      if (!token) return;
      const res = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRawMaterials(data.filter(m => m.currentStock > 0));
      }
    } catch (err) {
      // silent
    }
  };

  // 2. Real-time Customer Phone Lookup — debounced 600ms so it only fires after user stops typing
  useEffect(() => {
    if (customerPhone.length !== 10) {
      // Reset new-customer flag if phone is cleared/incomplete
      if (customerPhone.length < 10) setIsNewCustomer(true);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/phone/${customerPhone}`, {
          headers: { 'Authorization': `Bearer ${(() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''; } catch { return ''; } })()}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.name) {
            setCustomerName(data.name);
            setIsNewCustomer(false);
            showToast(`Welcome back, ${data.name}! (${data.totalVisits || 0} visits)`, 'success');
          } else {
            setIsNewCustomer(true);
          }
        } else {
          setIsNewCustomer(true);
        }
      } catch (err) {
        // silent — don't disturb the cashier's flow
      }
    }, 600);

    return () => clearTimeout(timer); // cleanup debounce on each keystroke
  }, [customerPhone]);

  // 3. Cart Functions — clicking a card adds directly; Customize button opens wizard
  const addToCart = (item) => {
    if (!item.isAvailable) {
      showToast(`${item.name} is currently out of stock!`, 'warning');
      return;
    }
    // Direct add with no customizations
    addItemToCartWithCustomizations(item, []);
  };

  const openCustomize = (e, item) => {
    e.stopPropagation(); // prevent card click from also adding to cart
    if (!item.isAvailable) {
      showToast(`${item.name} is currently out of stock!`, 'warning');
      return;
    }
    const initialSelections = {};
    CUST_CATEGORIES.forEach(c => { initialSelections[c.key] = c.multi ? [] : null; });
    setCustModal({ item, step: 0, selections: initialSelections });
  };

  // Shared: add item to cart with given customizations array
  const addItemToCartWithCustomizations = (item, customizations) => {
    const savedGst = localStorage.getItem('gstConfig');
    const gstConfig = savedGst ? JSON.parse(savedGst) : {};
    const finalGstPercent = gstConfig[item.category] !== undefined ? Number(gstConfig[item.category]) : (item.gstPercent || 5.0);
    const custKey = JSON.stringify(customizations);

    setCart(prev => {
      const idx = prev.findIndex(ci => ci._id === item._id && JSON.stringify(ci.customizations || []) === custKey);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, {
        _id: item._id,
        name: item.name,
        price: item.price,
        gstPercent: finalGstPercent,
        quantity: 1,
        customizations
      }];
    });
  };

  // Confirm customizations from wizard and add item to cart
  const confirmAddToCart = (item, selections) => {
    const customizations = [];
    CUST_CATEGORIES.forEach(cat => {
      const val = selections[cat.key];
      if (Array.isArray(val)) {
        val.forEach(name => customizations.push({ category: cat.label, name }));
      } else if (val && val !== 'none') {
        customizations.push({ category: cat.label, name: val });
      }
    });
    addItemToCartWithCustomizations(item, customizations);
    setCustModal(null);
  };

  const updateQuantity = (id, delta, customizations) => {

    const custKey = JSON.stringify(customizations || []);
    setCart(prev => {
      return prev.map(item => {
        if (item._id === id && JSON.stringify(item.customizations || []) === custKey) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };


  const removeFromCart = (id, customizations) => {
    const custKey = JSON.stringify(customizations || []);
    setCart(prev => prev.filter(item => 
      !(item._id === id && JSON.stringify(item.customizations || []) === custKey)
    ));
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
      items: cart.map(i => ({ menuItemId: i._id, quantity: i.quantity, customizations: i.customizations || [] })),
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
          'Authorization': `Bearer ${(() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}').token || ''; } catch { return ''; } })()}`
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

  // 6. Thermal Receipt Roll Printer — uses hidden iframe to bypass popup blockers
  const printThermalBill = (receipt = null) => {
    const r = receipt || activeReceipt;
    if (!r) return;

    // Remove any existing print iframes first
    const existing = document.getElementById('crftd-thermal-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'crftd-thermal-print-frame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:1px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    const tokenNumber = r.orderCode ? r.orderCode.replace('ORD-', '') : 'N/A';

    const itemsHtml = r.items.map(item => {
      const name = item.menuItem ? item.menuItem.name : (item.name || 'Coffee Item');
      const displayName = name.length > 20 ? name.substring(0, 18) + '..' : name;
      const price = Number(item.unitPrice || item.price || 0).toFixed(2);
      const total = Number(item.subtotal || (item.quantity * (item.unitPrice || item.price || 0))).toFixed(2);
      const customizationsArr = item.customizations || [];
      const customNote = customizationsArr.length > 0
        ? `<div style="font-size:9px;color:#555;padding-left:4px;margin-top:1px;">↳ ${customizationsArr.map(c => c.name).join(', ')}</div>`
        : '';
      return `
        <div style="margin-bottom: 4px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 50%;">${displayName}</div>
            <div style="width: 10%; text-align: center;">${item.quantity}</div>
            <div style="width: 20%; text-align: right;">${price}</div>
            <div style="width: 20%; text-align: right;">${total}</div>
          </div>
          ${customNote}
        </div>
      `;
    }).join('');

    const discountRow = Number(r.discountAmount || 0) > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Discount (${r.discountPercent || 0}%):</span>
        <span>-₹${Number(r.discountAmount).toFixed(2)}</span>
      </div>
    ` : '';

    const cashRow = r.paymentMethod === 'cash' ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Received:</span>
        <span>₹${Number(r.amountReceived || r.grandTotal || 0).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Change:</span>
        <span>₹${Number(r.changeToReturn || 0).toFixed(2)}</span>
      </div>
    ` : '';

    const customerRow = r.customer ? `
      <div style="margin-bottom: 4px;">Guest: ${r.customer.name} (${r.customer.phone})</div>
    ` : ((r.customerPhone || r.customer_phone) ? `<div style="margin-bottom: 4px;">Guest: ${r.customerName || r.customer_name || 'Walk-in'} (${r.customerPhone || r.customer_phone})</div>` : '');

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
            <div class="header-title">${storeDetails.name.toUpperCase()}</div>
            <div style="font-size: 9px; margin-bottom: 2px;">${storeDetails.address}</div>
            <div style="font-size: 9px; margin-bottom: 2px;">Phone: +91 ${storeDetails.phone}</div>
            <div style="font-size: 9px;">GSTIN: ${storeDetails.gstin}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="center" style="margin: 6px 0;">
            <span style="font-size: 13px; font-weight: bold; border: 1px double #000; padding: 2px 8px; display: inline-block;">
               KITCHEN TOKEN: ${tokenNumber}
            </span>
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
            <span>₹${Number(r.subtotal || 0).toFixed(2)}</span>
          </div>
          
          ${discountRow}
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>GST (5%):</span>
            <span>₹${Number(r.gstAmount || r.taxAmount || r.gstTotal || (r.subtotal * 0.05) || 0).toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 4px; margin-bottom: 4px;">
            <span>GRAND TOTAL:</span>
            <span>₹${Number(r.grandTotal || 0).toFixed(2)}</span>
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
        </body>
      </html>
    `;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Workaround for dynamic document load printing to avoid silent iframe bugs
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch(e) {
        showToast('Print failed — please use Download PDF instead', 'warning');
      }
      setTimeout(() => { if (iframe.parentNode) iframe.remove(); }, 3000);
    }, 200);
  };

  // 6b. Thermal PDF Generator (jsPDF) using Coffee Shop Theme Palette
  const generatePDF = () => {
    if (!activeReceipt) return;
    const r = activeReceipt;

    // Create a 80mm thermal receipt width format [80mm, 240mm] -> converted to points
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

    const orderNo = r.orderCode || 'ORD-0000';
    const dateStr = new Date(r.createdAt || Date.now()).toLocaleString('en-IN', {
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
    doc.text(`Order Type: ${(r.orderType || 'takeaway').toUpperCase()}`, marginLeft, y);
    y += 3.5;
    if (r.tableNumber) {
      doc.text(`Table No  : Table ${r.tableNumber}`, marginLeft, y);
      y += 3.5;
    }
    
    const guestName = r.customer ? r.customer.name : (r.customerName || r.customer_name || 'Walk-in Customer');
    doc.text(`Customer  : ${guestName}`, marginLeft, y);
    y += 3.5;
    
    const guestPhone = r.customer ? r.customer.phone : (r.customerPhone || r.customer_phone);
    if (guestPhone) {
      doc.text(`Cust Phone: +91 ${guestPhone}`, marginLeft, y);
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

    r.items?.forEach(item => {
      let itemName = item.menuItem ? item.menuItem.name : (item.name || 'Coffee Item');
      if (itemName.length > 21) {
        itemName = itemName.substring(0, 20) + '.';
      }
      
      const col1 = padR(itemName, 22);
      const col2 = padL(item.quantity.toString(), 3);
      const price = Number(item.unitPrice || item.price || 0);
      const total = Number(item.subtotal || (item.quantity * price));
      const col3 = padL(price.toFixed(2), 7);
      const col4 = padL(total.toFixed(2), 8);
      
      doc.text(`${col1}${col2}${col3}${col4}`, marginLeft, y);
      y += 4;
    });

    doc.text(singleLine, marginLeft, y);
    y += 4;

    const subtotalStr = (r.subtotal || 0).toFixed(2);
    doc.text(`Subtotal:                        ${padL(subtotalStr, 8)}`, marginLeft, y);
    y += 4;
    
    if (Number(r.discountAmount || 0) > 0) {
      const discountStr = Number(r.discountAmount).toFixed(2);
      doc.text(`Discount (${r.discountPercent || 0}%):                 -${padL(discountStr, 8)}`, marginLeft, y);
      y += 4;
    }

    const gstAmount = Number(r.gstAmount || r.taxAmount || r.gstTotal || (r.subtotal * 0.05) || 0);
    const gstStr = gstAmount.toFixed(2);
    doc.text(`GST collected:                   ${padL(gstStr, 8)}`, marginLeft, y);
    y += 4;

    doc.text(doubleLine, marginLeft, y);
    y += 4;

    doc.setFont('courier', 'bold');
    const grandStr = Number(r.grandTotal || 0).toFixed(2);
    doc.text(`GRAND TOTAL (INR):               ${padL(grandStr, 8)}`, marginLeft, y);
    doc.setFont('courier', 'normal');
    y += 4.5;

    doc.text(`Payment Method: ${(r.paymentMethod || 'cash').toUpperCase()}`, marginLeft, y);
    y += 3.5;
    doc.text(`Payment Status: ${(r.paymentStatus || 'paid').toUpperCase()}`, marginLeft, y);
    y += 3.5;

    if ((r.paymentMethod || '').toLowerCase() === 'cash' && r.amountReceived) {
      const receivedStr = Number(r.amountReceived).toFixed(2);
      const returnStr = Number(r.changeToReturn || 0).toFixed(2);
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
            <div>
              <div className="pos-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="glass skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '1rem' }}>
                ⏳ Loading menu… (waking up server, may take a moment)
              </p>
            </div>
          ) : menuItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', gap: '1rem' }}>
              <Coffee size={48} style={{ opacity: 0.5 }} />
              <p>Could not load menu items.</p>
              <button
                onClick={() => fetchMenu()}
                style={{ padding: '0.6rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                ↺ Retry
              </button>
            </div>
          ) : filteredMenu.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
              <Coffee size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No items found in this category.</p>
            </div>
          ) : (
            <div className="pos-grid">
              {sortMenuAdjacent(filteredMenu).map(item => (
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
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'var(--error)',
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: '800',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '10px',
                      zIndex: 2,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      Out of stock
                    </div>
                  )}

                  {/* Product Image with floating Customize button */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDish(item);
                    }}
                    style={{
                      width: '100%',
                      height: '135px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--border-light)',
                      position: 'relative',
                      cursor: 'zoom-in'
                    }}
                  >
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

                    {/* Floating Customize pill — overlaid on image bottom */}
                    {item.isAvailable && (
                      <button
                        onClick={(e) => openCustomize(e, item)}
                        title="Build Your Own"
                        className="customize-pill"
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          height: '28px',
                          background: 'linear-gradient(135deg, rgba(140,98,57,0.92), rgba(180,130,80,0.92))',
                          backdropFilter: 'blur(4px)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          letterSpacing: '0.04em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          transition: 'opacity 0.2s, transform 0.2s',
                          opacity: 0,
                          transform: 'translateY(4px)',
                          zIndex: 3
                        }}
                      >
                        <Settings2 size={11} /> BUILD YOUR OWN
                      </button>
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
            cart.map((item, idx) => (
              <div key={`${item._id}-${idx}`} className="cart-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{Number(item.price).toFixed(2)}</span>
                  </div>
                  
                  {/* Quantity adjustments +/- */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0.75rem' }}>
                    <button 
                      onClick={() => updateQuantity(item._id, -1, item.customizations)}
                      style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item._id, 1, item.customizations)}
                      style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Remove Trash icon */}
                  <button 
                    onClick={() => removeFromCart(item._id, item.customizations)}
                    style={{ background: 'transparent', border: 'none', color: '#d9534f', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Customization tags */}
                {item.customizations && item.customizations.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', paddingLeft: '0.1rem' }}>
                    {item.customizations.map((c, ci) => (
                      <span key={ci} style={{
                        fontSize: '0.68rem', fontWeight: '700',
                        background: 'rgba(140,98,57,0.1)', color: 'var(--primary)',
                        padding: '0.1rem 0.4rem', borderRadius: '10px',
                        border: '1px solid rgba(140,98,57,0.2)'
                      }}>{c.name}</span>
                    ))}
                  </div>
                )}
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
      {/* BUILD YOUR OWN CUSTOMIZATION WIZARD MODAL */}
      {custModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            width: '480px', maxWidth: '95vw',
            background: 'var(--bg-panel)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              padding: '1.25rem 1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Build Your Own</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>{custModal.item.name}</div>
              </div>
              <button onClick={() => setCustModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div style={{ display: 'flex', padding: '0.75rem 1.5rem 0', gap: '0.4rem' }}>
              {CUST_CATEGORIES.map((cat, i) => (
                <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= custModal.step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
              ))}
            </div>

            {/* Step Label */}
            <div style={{ padding: '0.75rem 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{CUST_CATEGORIES[custModal.step]?.emoji}</span>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{CUST_CATEGORIES[custModal.step]?.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Step {custModal.step + 1} of {CUST_CATEGORIES.length} — {CUST_CATEGORIES[custModal.step]?.multi ? 'Select all that apply' : 'Select one'}
                </div>
              </div>
            </div>

            {/* Options List */}
            <div style={{ padding: '0.75rem 1.5rem', maxHeight: '240px', overflowY: 'auto' }} className="custom-scroll">
              {(() => {
                const cat = CUST_CATEGORIES[custModal.step];
                const options = rawMaterials.filter(m => {
                  if (cat.categories) {
                    return cat.categories.includes(m.category);
                  }
                  return m.category === cat.key;
                });
                const currentVal = custModal.selections[cat.key];

                if (options.length === 0) {
                  return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0', textAlign: 'center' }}>No options available — will skip this step.</div>;
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {/* None option */}
                    {!cat.multi && (
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${currentVal === null || currentVal === 'none' ? 'var(--primary)' : 'var(--border)'}`,
                        background: currentVal === null || currentVal === 'none' ? 'rgba(140,98,57,0.07)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}>
                        <input type="radio" name={`cust-${cat.key}`} checked={currentVal === null || currentVal === 'none'}
                          onChange={() => setCustModal(prev => ({ ...prev, selections: { ...prev.selections, [cat.key]: 'none' } }))}
                          style={{ accentColor: 'var(--primary)' }} />
                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>None / Standard</span>
                      </label>
                    )}
                    {options.map(opt => {
                      const isSelected = cat.multi
                        ? (Array.isArray(currentVal) && currentVal.includes(opt.name))
                        : currentVal === opt.name;
                      return (
                        <label key={opt.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          background: isSelected ? 'rgba(140,98,57,0.07)' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}>
                          {cat.multi ? (
                            <input type="checkbox" checked={isSelected}
                              onChange={() => setCustModal(prev => {
                                const arr = Array.isArray(prev.selections[cat.key]) ? [...prev.selections[cat.key]] : [];
                                const ni = arr.includes(opt.name) ? arr.filter(x => x !== opt.name) : [...arr, opt.name];
                                return { ...prev, selections: { ...prev.selections, [cat.key]: ni } };
                              })}
                              style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                          ) : (
                            <input type="radio" name={`cust-${cat.key}`} checked={isSelected}
                              onChange={() => setCustModal(prev => ({ ...prev, selections: { ...prev.selections, [cat.key]: opt.name } }))}
                              style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{opt.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stock: {formatStock(opt.currentStock, opt.unit)}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Navigation Buttons: Back | Skip | Next/Add to Cart */}
            <div style={{ padding: '1rem 1.5rem 1.25rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)' }}>
              {/* Back / Cancel */}
              <button
                onClick={() => {
                  if (custModal.step === 0) setCustModal(null);
                  else setCustModal(prev => ({ ...prev, step: prev.step - 1 }));
                }}
                style={{ flex: 1, height: '2.5rem', background: 'var(--border)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
              >
                <ChevronLeft size={14} /> {custModal.step === 0 ? 'Cancel' : 'Back'}
              </button>

              {/* Skip */}
              <button
                onClick={() => {
                  // Clear selection for current step and advance (or confirm)
                  const cat = CUST_CATEGORIES[custModal.step];
                  const clearedSelections = { ...custModal.selections, [cat.key]: cat.multi ? [] : null };
                  if (custModal.step < CUST_CATEGORIES.length - 1) {
                    setCustModal(prev => ({ ...prev, step: prev.step + 1, selections: clearedSelections }));
                  } else {
                    confirmAddToCart(custModal.item, clearedSelections);
                  }
                }}
                style={{ flex: 1, height: '2.5rem', background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.85rem' }}
              >
                Skip
              </button>

              {/* Next / Add to Cart */}
              {custModal.step < CUST_CATEGORIES.length - 1 ? (
                <button
                  onClick={() => setCustModal(prev => ({ ...prev, step: prev.step + 1 }))}
                  style={{ flex: 1.5, height: '2.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => confirmAddToCart(custModal.item, custModal.selections)}
                  style={{ flex: 1.5, height: '2.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                >
                  <CheckCircle size={14} /> Add to Cart
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* DISH DETAILS MODAL */}
      {selectedDish && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass animate-slide-up" style={{
            width: '480px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Close button */}
            <button 
              onClick={() => setSelectedDish(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                border: 'none',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '50%',
                padding: '0.4rem',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <X size={18} />
            </button>

            {/* Top Large Image Cover */}
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: 'var(--border-light)',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
              {selectedDish.imageUrl ? (
                <img 
                  src={selectedDish.imageUrl} 
                  alt={selectedDish.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)' }}>
                  <Coffee size={64} />
                </div>
              )}
            </div>

            {/* Dish Info */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'var(--primary)', 
                fontWeight: '800', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {selectedDish.category.replace('_', ' ')}
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                {selectedDish.name}
              </h2>
              {selectedDish.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {selectedDish.description}
                </p>
              )}
            </div>

            {/* Nutritional metrics grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                Nutrition Estimates (Per Serving)
              </h3>
              {(() => {
                const nut = getNutrition(selectedDish.name);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>CALORIES</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{nut.calories} kcal</span>
                    </div>
                    <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>CARBS</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{nut.carbs}g</span>
                    </div>
                    <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>PROTEIN</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{nut.protein}g</span>
                    </div>
                    <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>FAT</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{nut.fat}g</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Ingredients used */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                Key Ingredients Used
              </h3>
              {selectedDish.recipe && selectedDish.recipe.ingredients && selectedDish.recipe.ingredients.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto' }} className="custom-scroll">
                  {selectedDish.recipe.ingredients.map(ing => (
                    <span 
                      key={ing.id} 
                      style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        padding: '0.35rem 0.75rem', 
                        borderRadius: '20px', 
                        background: 'var(--bg-dark)', 
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      🌱 {ing.rawMaterial ? ing.rawMaterial.name : 'Ingredient'}
                      <span style={{ color: 'var(--primary)', fontWeight: '800' }}>
                        ({ing.quantity} {ing.unit})
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No default recipe configured for this item.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setSelectedDish(null)}
                className="btn btn-secondary" 
                style={{ flex: 1, height: '2.6rem', justifyContent: 'center' }}
              >
                Close Details
              </button>
              {selectedDish.isAvailable ? (
                <button 
                  onClick={() => {
                    addToCart(selectedDish);
                    setSelectedDish(null);
                  }}
                  className="btn btn-primary" 
                  style={{ flex: 1.5, height: '2.6rem', justifyContent: 'center' }}
                >
                  <ShoppingCart size={16} /> Add to Cart — ₹{selectedDish.price.toFixed(2)}
                </button>
              ) : (
                <button 
                  disabled
                  className="btn" 
                  style={{ 
                    flex: 1.5, 
                    height: '2.6rem', 
                    justifyContent: 'center', 
                    backgroundColor: 'var(--border)', 
                    color: 'var(--text-subtle)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '700',
                    cursor: 'not-allowed'
                  }}
                >
                  Out of Stock
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default POS;
