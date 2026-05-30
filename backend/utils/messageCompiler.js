/**
 * Helper to dynamically compile a rich text transactional message body
 */
export const compileReceiptMessage = (order, customer, itemsList, invoiceUrl) => {
  const customerName = customer?.name || order.customer_name || 'Valued Guest';
  const orderNumber = order.order_code;
  
  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  // 1. Compile Items List dynamically
  const itemsText = itemsList.map(item => {
    const itemName = item.menuItem?.name || item.name || 'Coffee Item';
    const price = Number(item.unitPrice || item.unit_price || item.priceAtTime || item.price || 0).toFixed(2);
    return `${itemName} × ${item.quantity} — ₹${price}`;
  }).join('\n');

  // 2. Financial Summary
  const subtotal = Number(order.subtotal || 0).toFixed(2);
  const tax = Number(order.gst_amount || order.tax_amount || 0).toFixed(2);
  const deliveryFee = Number(order.delivery_fee || 0).toFixed(2);
  const totalAmount = Number(order.grand_total || order.total_amount || 0).toFixed(2);

  // 3. Preparation/Delivery Time Estimate
  const estTime = order.order_type === 'dine_in' ? '10-15 minutes' : '15-20 minutes';
  const supportPhone = '+91 9876543210';

  return `☕ *Thank You for Your Order!*

Hello *${customerName}*,

We've successfully received your order and it's now being prepared.

📋 *Order Details*
• Order Number: *#${orderNumber}*
• Order Date & Time: *${formattedDate}*

🛍️ *Items Ordered*
${itemsText}

💰 *Bill Summary*
Subtotal: ₹${subtotal}
Taxes & Charges: ₹${tax}
Delivery Charges: ₹${deliveryFee}
*Total Amount: ₹${totalAmount}*

🧾 *Bill/Invoice:*
${invoiceUrl}

⏱️ Estimated Preparation/Delivery Time: *${estTime}*

If you have any questions, simply reply to this message or contact us at *${supportPhone}*.

Thank you for choosing CRFTD. ❤️

We look forward to serving you again!`;
};
