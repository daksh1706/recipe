import { jsPDF } from 'jspdf';

const storeDetails = {
  name: 'CRFTD',
  address: 'Premium Crafted Experience, 123 Espresso Avenue',
  phone: '+91 9876543210',
  gstin: '27CRFTD0000A1Z5'
};

/**
 * Server-side PDF Generator for CRFTD Receipts using jsPDF
 * Compiles a perfectly aligned monospace Courier receipt PDF
 */
export const generateReceiptPDFBuffer = (order, customer, itemsList) => {
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
  
  doc.text(`Phone: ${storeDetails.phone}`, marginLeft, y);
  y += 3.5;
  doc.text(`GSTIN: ${storeDetails.gstin}`, marginLeft, y);
  y += 4.5;
  
  doc.text(doubleLine, marginLeft, y);
  y += 4;

  const orderNo = order.order_code || 'ORD-0000';
  const dateStr = new Date(order.created_at || Date.now()).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Kolkata'
  });

  const billNo = `BILL-${orderNo.replace('ORD-', '')}`;
  const tokenNo = orderNo.split('-').pop();
  doc.text(`Bill No   : ${billNo}`, marginLeft, y);
  y += 3.5;
  doc.text(`Order Code: ${orderNo} (Token: ${tokenNo})`, marginLeft, y);
  y += 3.5;
  doc.text(`Date      : ${dateStr}`, marginLeft, y);
  y += 3.5;
  doc.text(`Order Type: ${(order.order_type || 'takeaway').toUpperCase()}`, marginLeft, y);
  y += 3.5;
  if (order.table_number) {
    doc.text(`Table No  : Table ${order.table_number}`, marginLeft, y);
    y += 3.5;
  }
  
  const guestName = customer?.name || order.customer_name || 'Walk-in Customer';
  doc.text(`Customer  : ${guestName}`, marginLeft, y);
  y += 3.5;
  
  const guestPhone = customer?.phone || order.customer_phone;
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

  itemsList?.forEach(item => {
    let itemName = item.menuItem?.name || item.name || 'Coffee Item';
    if (itemName.length > 21) {
      itemName = itemName.substring(0, 20) + '.';
    }
    
    const col1 = padR(itemName, 22);
    const col2 = padL(item.quantity.toString(), 3);
    
    const price = Number(item.unitPrice || item.unit_price || item.priceAtTime || item.price || 0);
    const total = Number(item.subtotal || (item.quantity * price));
    
    const col3 = padL(price.toFixed(2), 7);
    const col4 = padL(total.toFixed(2), 8);
    
    doc.text(`${col1}${col2}${col3}${col4}`, marginLeft, y);
    y += 4;
  });

  doc.text(singleLine, marginLeft, y);
  y += 4;

  const subtotalStr = Number(order.subtotal || 0).toFixed(2);
  doc.text(`Subtotal:                        ${padL(subtotalStr, 8)}`, marginLeft, y);
  y += 4;
  
  const discountAmount = Number(order.discount_amount || 0);
  if (discountAmount > 0) {
    const discountStr = discountAmount.toFixed(2);
    doc.text(`Discount (${order.discount_percent || 0}%):                 -${padL(discountStr, 8)}`, marginLeft, y);
    y += 4;
  }

  const gstAmount = Number(order.gst_amount || order.tax_amount || 0);
  const gstStr = gstAmount.toFixed(2);
  doc.text(`GST collected:                   ${padL(gstStr, 8)}`, marginLeft, y);
  y += 4;

  doc.text(doubleLine, marginLeft, y);
  y += 4;

  doc.setFont('courier', 'bold');
  const grandStr = Number(order.grand_total || 0).toFixed(2);
  doc.text(`GRAND TOTAL (INR):               ${padL(grandStr, 8)}`, marginLeft, y);
  doc.setFont('courier', 'normal');
  y += 4.5;

  doc.text(`Payment Method: ${(order.payment_method || 'cash').toUpperCase()}`, marginLeft, y);
  y += 3.5;
  doc.text(`Payment Status: ${(order.payment_status || 'paid').toUpperCase()}`, marginLeft, y);
  y += 3.5;

  if ((order.payment_method || '').toLowerCase() === 'cash' && order.amount_received) {
    const receivedStr = Number(order.amount_received).toFixed(2);
    const returnStr = Number(order.change_to_return || 0).toFixed(2);
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

  // Return Node.js Buffer from arraybuffer
  const pdfArray = doc.output('arraybuffer');
  return Buffer.from(pdfArray);
};
