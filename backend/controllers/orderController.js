import { supabase } from '../config/supabase.js';

// Helper to generate ORD-0001, ORD-0002 format
const generateOrderCode = async (workspaceId) => {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    const nextNum = (count || 0) + 1;
    return `ORD-${nextNum.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Error generating order code:", error.message);
    return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  }
};

const getConversionFactor = (unit) => {
  if (!unit) return 1;
  const u = unit.toLowerCase();
  if (u === 'ml') return 1;
  if (u === 'l' || u === 'liter' || u === 'liters') return 1000;
  if (u === 'g' || u === 'gm' || u === 'gram' || u === 'grams') return 1;
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return 1000;
  if (u === 'tsp') return 5;
  if (u === 'tbsp') return 15;
  if (u === 'cup') return 240;
  if (u === 'pinch') return 0.36;
  return 1;
};

const getBaseUnitType = (unit) => {
  if (!unit) return 'other';
  const u = unit.toLowerCase();
  if (['ml', 'l', 'tsp', 'tbsp', 'cup'].includes(u)) return 'volume';
  if (['g', 'gm', 'kg', 'pinch'].includes(u)) return 'weight';
  return 'other';
};

const calculateDeductionQuantity = (recipeQty, recipeUnit, rawMaterial) => {
  if (!rawMaterial) return recipeQty;
  const rawUnit = rawMaterial.unit ? rawMaterial.unit.toLowerCase() : '';
  
  if (['bottle', 'pouch', 'pack'].includes(rawUnit)) {
    const packQty = Number(rawMaterial.quantity_per_pack || 1);
    const packUnit = rawMaterial.pack_capacity_unit ? rawMaterial.pack_capacity_unit.toLowerCase() : 'ml';
    
    const recipeBaseFactor = getConversionFactor(recipeUnit);
    const packBaseFactor = getConversionFactor(packUnit);
    
    const recipeQtyInBase = recipeQty * recipeBaseFactor;
    const packCapacityInBase = packQty * packBaseFactor;
    
    if (packCapacityInBase > 0) {
      return recipeQtyInBase / packCapacityInBase;
    }
  } else {
    // Standard compatible conversion
    const recipeBaseFactor = getConversionFactor(recipeUnit);
    const rawBaseFactor = getConversionFactor(rawUnit);
    
    const recipeType = getBaseUnitType(recipeUnit);
    const rawType = getBaseUnitType(rawUnit);
    
    if (recipeType === rawType && recipeType !== 'other') {
      const qtyInBase = recipeQty * recipeBaseFactor;
      return qtyInBase / rawBaseFactor;
    }
  }
  return recipeQty;
};

// Checkout endpoint
export const createOrder = async (req, res) => {
  const { 
    items, 
    orderType, 
    order_type,
    tableNumber, 
    table_number,
    discountPercent, 
    discount_percent,
    notes,
    paymentMethod, 
    payment_method,
    paymentStatus,
    payment_status,
    amountReceived, 
    amount_received,
    customerName,
    customerPhone,
    customer_phone
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in cart' });
  }

  // Parameter mappings
  const finalOrderType = orderType || order_type || 'takeaway';
  const finalTableNumber = tableNumber !== undefined ? tableNumber : (table_number !== undefined ? table_number : null);
  const finalDiscountPercent = Number(discountPercent !== undefined ? discountPercent : (discount_percent !== undefined ? discount_percent : 0));
  const finalPaymentMethod = (paymentMethod || payment_method || 'cash').toLowerCase();
  const finalPaymentStatus = (paymentStatus || payment_status || 'paid').toLowerCase();
  const finalAmountReceived = Number(amountReceived !== undefined ? amountReceived : (amount_received !== undefined ? amount_received : 0));
  
  const finalPhone = customerPhone || customer_phone || '';

  try {
    let subtotal = 0;
    let totalGst = 0;
    const processedItems = [];
    const stockDeductions = [];

    // Calculate subtotal, GST, and gather stock deductions
    for (const item of items) {
      const { data: menuItem, error: menuErr } = await supabase
        .from('menu_items')
        .select('*, recipes(*, recipe_ingredients(*, raw_materials(*)))')
        .eq('id', item.menuItemId || item.menu_item_id)
        .eq('workspace_id', req.workspace_id)
        .single();

      if (menuErr || !menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${item.menuItemId || item.menu_item_id}` });
      }

      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(menuItem.price);
      const itemSubtotal = unitPrice * quantity;
      const itemCustomizations = item.customizations || [];
      
      const itemGst = itemSubtotal * (Number(menuItem.gst_percent) / 100);

      subtotal += itemSubtotal;
      totalGst += itemGst;

      processedItems.push({
        menu_item_id: menuItem.id,
        quantity,
        unit_price: unitPrice,
        subtotal: itemSubtotal,
        customizations: itemCustomizations
      });

      // Recipe ingredient stock deduction checks
      const recipe = menuItem.recipes && menuItem.recipes.length > 0 ? menuItem.recipes[0] : null;
      if (recipe && recipe.recipe_ingredients) {
        for (const ri of recipe.recipe_ingredients) {
          const totalNeededRaw = Number(ri.quantity) * quantity;
          const totalNeeded = calculateDeductionQuantity(totalNeededRaw, ri.unit, ri.raw_materials);
          stockDeductions.push({
            raw_material_id: ri.raw_material_id,
            quantity: totalNeeded,
            name: ri.raw_materials ? ri.raw_materials.name : 'Unknown Material',
            current_stock: ri.raw_materials ? Number(ri.raw_materials.current_stock) : 0,
            unit: ri.unit
          });
        }
      }
    }

    const discountAmount = subtotal * (finalDiscountPercent / 100);
    const grandTotal = subtotal + totalGst - discountAmount;
    const changeToReturn = Math.max(0, finalAmountReceived - grandTotal);

    // Customer setup / update
    let customerId = null;
    if (finalPhone && customerName) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', finalPhone)
        .eq('workspace_id', req.workspace_id)
        .maybeSingle();

      if (existingCustomer) {
        const { data: updatedCustomer } = await supabase
          .from('customers')
          .update({
            name: customerName,
            total_visits: Number(existingCustomer.total_visits || 0) + 1,
            total_spent: Number(existingCustomer.total_spent || 0) + grandTotal,
            last_visit_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', existingCustomer.id)
          .eq('workspace_id', req.workspace_id)
          .select()
          .single();
        
        if (updatedCustomer) {
          customerId = updatedCustomer.id;
        }
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            phone: finalPhone,
            total_visits: 1,
            total_spent: grandTotal,
            first_visit_date: new Date().toISOString().split('T')[0],
            last_visit_date: new Date().toISOString().split('T')[0],
            workspace_id: req.workspace_id
          })
          .select()
          .single();

        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }
    }

    // Generate Order Code
    const orderCode = await generateOrderCode(req.workspace_id);

    // Create Order Record
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_code: orderCode,
        customer_id: customerId,
        order_type: finalOrderType,
        table_number: finalTableNumber,
        status: 'pending',
        subtotal,
        discount_percent: finalDiscountPercent,
        discount_amount: discountAmount,
        gst_amount: totalGst,
        grand_total: grandTotal,
        payment_method: finalPaymentMethod,
        payment_status: finalPaymentStatus,
        amount_received: finalAmountReceived,
        change_to_return: changeToReturn,
        staff_id: req.user ? req.user.id : null,
        notes: notes || '',
        workspace_id: req.workspace_id
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase.from('order_items').insert(
      processedItems.map(pi => ({
        order_id: order.id,
        menu_item_id: pi.menu_item_id,
        quantity: pi.quantity,
        unit_price: pi.unit_price,
        subtotal: pi.subtotal,
        customizations: pi.customizations && pi.customizations.length > 0 ? JSON.stringify(pi.customizations) : '[]',
        workspace_id: req.workspace_id
      }))
    );
    if (itemsErr) throw itemsErr;

    // Deduct stock from raw materials and log transaction
    for (const ded of stockDeductions) {
      const newStock = Math.max(0, ded.current_stock - ded.quantity);
      
      // Update inventory stock
      await supabase
        .from('raw_materials')
        .update({ current_stock: newStock })
        .eq('id', ded.raw_material_id)
        .eq('workspace_id', req.workspace_id);

      // Log stock transaction
      await supabase.from('stock_transactions').insert({
        raw_material_id: ded.raw_material_id,
        transaction_type: 'deduction',
        quantity: ded.quantity,
        reference_id: order.id,
        notes: `POS order ${orderCode} sales deduction`,
        workspace_id: req.workspace_id
      });

      // Emit real time socket notifications if stock is low
      if (req.io) {
        req.io.emit('inventory_updated', { 
          type: 'update', 
          item: { _id: ded.raw_material_id, currentStock: newStock, name: ded.name } 
        });
      }
    }

    // Fetch complete populated order for frontend mapping
    const { data: populated } = await supabase
      .from('orders')
      .select('*, customer:customers(*), staff:users(*), order_items(*, menu_items(*))')
      .eq('id', order.id)
      .eq('workspace_id', req.workspace_id)
      .single();

    const responseOrder = {
      ...populated,
      _id: populated.id,
      orderCode: populated.order_code,
      orderType: populated.order_type,
      tableNumber: populated.table_number,
      discountPercent: Number(populated.discount_percent),
      discountAmount: Number(populated.discount_amount),
      gstAmount: Number(populated.gst_amount),
      grandTotal: Number(populated.grand_total),
      paymentMethod: populated.payment_method,
      paymentStatus: populated.payment_status,
      amountReceived: Number(populated.amount_received),
      changeToReturn: Number(populated.change_to_return),
      createdAt: populated.created_at,
      updatedAt: populated.updated_at,
      customer: populated.customer ? {
        ...populated.customer,
        _id: populated.customer.id,
        totalVisits: Number(populated.customer.total_visits),
        totalSpent: Number(populated.customer.total_spent)
      } : null,
      items: populated.order_items ? populated.order_items.map(oi => ({
        ...oi,
        _id: oi.id,
        menuItemId: oi.menu_item_id,
        unitPrice: Number(oi.unit_price),
        subtotal: Number(oi.subtotal),
        menuItem: oi.menu_items
      })) : []
    };

    if (req.io) {
      req.io.emit('order_created', responseOrder);
    }

    res.status(201).json(responseOrder);
  } catch (error) {
    console.error("POS Checkout error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Retrieve historical orders (Order Ledger) with filters
export const getOrders = async (req, res) => {
  try {
    const { status, type, payment, staff, startDate, endDate, search } = req.query;

    let query = supabase
      .from('orders')
      .select('*, customer:customers(*), staff:users(*), order_items(*, menu_items(*))')
      .eq('workspace_id', req.workspace_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) query = query.eq('status', status.toLowerCase());
    if (type) query = query.eq('order_type', type.toLowerCase());
    if (payment) query = query.eq('payment_method', payment.toLowerCase());
    if (staff) query = query.eq('staff_id', staff);

    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) query = query.lte('created_at', new Date(endDate).toISOString());

    const { data: orders, error } = await query;
    if (error) throw error;

    // Filter by search (order_code, customer name, customer phone)
    let filtered = orders;
    if (search) {
      const term = search.toLowerCase();
      filtered = orders.filter(o => 
        o.order_code.toLowerCase().includes(term) ||
        (o.customer && o.customer.name.toLowerCase().includes(term)) ||
        (o.customer && o.customer.phone.includes(term))
      );
    }

    // Format response
    const formatted = filtered.map(o => ({
      ...o,
      _id: o.id,
      orderCode: o.order_code,
      orderType: o.order_type,
      tableNumber: o.table_number,
      discountPercent: Number(o.discount_percent),
      discountAmount: Number(o.discount_amount),
      gstAmount: Number(o.gst_amount),
      grandTotal: Number(o.grand_total),
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
      customer: o.customer ? { ...o.customer, _id: o.customer.id } : null,
      items: o.order_items ? o.order_items.map(oi => ({
        ...oi,
        _id: oi.id,
        menuItemId: oi.menu_item_id,
        unitPrice: Number(oi.unit_price),
        subtotal: Number(oi.subtotal),
        menuItem: oi.menu_items
      })) : []
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status (Pending -> Preparing -> Ready -> Served)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'preparing', 'ready', 'served', 'cancelled'].includes(status.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid order status' });
  }

  try {
    // Check old status
    const { data: oldOrder, error: oldErr } = await supabase
      .from('orders')
      .select('status, order_code')
      .eq('id', id)
      .eq('workspace_id', req.workspace_id)
      .single();

    if (oldErr || !oldOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', req.workspace_id)
      .select('*, customer:customers(*), staff:users(*), order_items(*, menu_items(*))')
      .single();

    if (error) throw error;

    // IF status changed to cancelled AND it wasn't already cancelled, restore inventory stocks!
    if (status.toLowerCase() === 'cancelled' && oldOrder.status !== 'cancelled') {
      console.log(`Reverting stock deductions for cancelled order: ${oldOrder.order_code}`);
      
      // Fetch ingredients to restore
      for (const item of order.order_items) {
        const { data: menuItem } = await supabase
          .from('menu_items')
          .select('*, recipes(*, recipe_ingredients(*, raw_materials(*)))')
          .eq('id', item.menu_item_id)
          .eq('workspace_id', req.workspace_id)
          .single();

        if (menuItem && menuItem.recipes && menuItem.recipes.length > 0) {
          const recipe = menuItem.recipes[0];
          if (recipe.recipe_ingredients) {
            for (const ri of recipe.recipe_ingredients) {
              const totalRestore = calculateDeductionQuantity(Number(ri.quantity) * Number(item.quantity), ri.unit, ri.raw_materials);
              
              if (ri.raw_materials) {
                const current = Number(ri.raw_materials.current_stock || 0);
                const restoredStock = current + totalRestore;

                // Update stock in raw_materials
                await supabase
                  .from('raw_materials')
                  .update({ current_stock: restoredStock })
                  .eq('id', ri.raw_material_id)
                  .eq('workspace_id', req.workspace_id);

                // Log cancellation restock transaction
                await supabase.from('stock_transactions').insert({
                  raw_material_id: ri.raw_material_id,
                  transaction_type: 'restock',
                  quantity: totalRestore,
                  reference_id: id,
                  notes: `Restored from cancelled POS order ${oldOrder.order_code}`,
                  workspace_id: req.workspace_id
                });

                if (req.io) {
                  req.io.emit('inventory_updated', {
                    type: 'update',
                    item: { _id: ri.raw_material_id, currentStock: restoredStock, name: ri.raw_materials.name }
                  });
                }
              }
            }
          }
        }
      }
    }

    const formatted = {
      ...order,
      _id: order.id,
      orderCode: order.order_code,
      orderType: order.order_type,
      tableNumber: order.table_number,
      discountPercent: Number(order.discount_percent),
      discountAmount: Number(order.discount_amount),
      gstAmount: Number(order.gst_amount),
      grandTotal: Number(order.grand_total),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      customer: order.customer ? { ...order.customer, _id: order.customer.id } : null,
      items: order.order_items ? order.order_items.map(oi => ({
        ...oi,
        _id: oi.id,
        menuItemId: oi.menu_item_id,
        unitPrice: Number(oi.unit_price),
        subtotal: Number(oi.subtotal),
        menuItem: oi.menu_items
      })) : []
    };

    if (req.io) {
      req.io.emit('order_status_updated', formatted);
    }

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*), order_items(*, menu_items(*))')
      .eq('id', order_id)
      .eq('workspace_id', req.workspace_id)
      .single();

    if (error || !order) {
      console.error("Confirm Payment error or order not found:", error);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Map order fields to what PaymentSuccess.jsx expects
    const formattedOrder = {
      id: order.id,
      orderNumber: order.order_code,
      invoiceNumber: `BILL-${order.order_code.replace('ORD-', '')}`,
      createdAt: order.created_at,
      subtotal: Number(order.subtotal || 0),
      discountAmount: Number(order.discount_amount || 0),
      taxAmount: Number(order.gst_amount || 0),
      totalAmount: Number(order.grand_total || 0),
      paymentMethod: (order.payment_method || 'CASH').toUpperCase(),
      customerDetails: order.customer ? {
        phone: order.customer.phone,
        name: order.customer.name
      } : null,
      items: (order.order_items || []).map(item => ({
        menuItem: item.menu_items ? { name: item.menu_items.name } : { name: 'Item' },
        quantity: item.quantity,
        subtotal: Number(item.subtotal || 0),
        customizations: []
      }))
    };

    res.json(formattedOrder);
  } catch (err) {
    console.error("Error in confirmPayment controller:", err);
    res.status(500).json({ message: err.message });
  }
};

