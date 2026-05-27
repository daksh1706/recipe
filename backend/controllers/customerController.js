import { supabase } from '../config/supabase.js';

// Get all customers with basic info
export const getAllCustomers = async (req, res) => {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('total_spent', { ascending: false });

    if (error) throw error;

    // CamelCase compatibility mapping
    const formatted = customers.map(c => ({
      ...c,
      _id: c.id,
      firstVisitDate: c.first_visit_date,
      lastVisitDate: c.last_visit_date,
      totalVisits: Number(c.total_visits || 0),
      totalSpent: Number(c.total_spent || 0),
      isVIP: Number(c.total_visits || 0) >= 10 // Loyalty badge indicator
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve a single customer's full profile including past orders, feedback, and favorite menu item
export const getCustomerProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch customer's past orders
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (ordErr) throw ordErr;

    // Fetch customer's past feedback
    const { data: feedbacks, error: feedErr } = await supabase
      .from('feedback')
      .select('*, menu_items(*)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (feedErr) throw feedErr;

    // Calculate favorite (most ordered) item
    const itemCounts = {};
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        if (order.order_items) {
          order.order_items.forEach(oi => {
            if (oi.menu_items) {
              const name = oi.menu_items.name;
              itemCounts[name] = (itemCounts[name] || 0) + oi.quantity;
            }
          });
        }
      });
    }

    let favoriteItem = 'None';
    let maxCount = 0;
    Object.entries(itemCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteItem = name;
      }
    });

    const profile = {
      ...customer,
      _id: customer.id,
      firstVisitDate: customer.first_visit_date,
      lastVisitDate: customer.last_visit_date,
      totalVisits: Number(customer.total_visits || 0),
      totalSpent: Number(customer.total_spent || 0),
      isVIP: Number(customer.total_visits || 0) >= 10,
      favoriteItem,
      orders: orders.map(o => ({
        ...o,
        _id: o.id,
        orderCode: o.order_code,
        grandTotal: Number(o.grand_total),
        createdAt: o.created_at
      })),
      feedback: feedbacks.map(f => ({
        ...f,
        _id: f.id,
        menuItem: f.menu_items ? f.menu_items.name : 'General Shop',
        createdAt: f.created_at
      }))
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Autocomplete / Search endpoint to lookup customer details by phone during order taking
export const getCustomerByPhone = async (req, res) => {
  const { phone } = req.params;
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;

    if (customer) {
      res.json({
        ...customer,
        _id: customer.id,
        totalVisits: Number(customer.total_visits || 0),
        totalSpent: Number(customer.total_spent || 0)
      });
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new customer manually
export const addCustomer = async (req, res) => {
  const { name, phone, email, notes } = req.body;
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        name,
        phone,
        email: email || '',
        notes: notes || '',
        total_visits: 0,
        total_spent: 0.0,
        first_visit_date: new Date().toISOString().split('T')[0],
        last_visit_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'A customer with this phone number already exists' });
      }
      throw error;
    }

    const mapped = {
      ...customer,
      _id: customer.id,
      totalVisits: Number(customer.total_visits || 0),
      totalSpent: Number(customer.total_spent || 0)
    };

    res.status(201).json(mapped);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update customer details
export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, notes } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (notes !== undefined) updates.notes = notes;

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'A customer with this phone number already exists' });
      }
      throw error;
    }

    const mapped = {
      ...customer,
      _id: customer.id,
      totalVisits: Number(customer.total_visits || 0),
      totalSpent: Number(customer.total_spent || 0)
    };

    res.json(mapped);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a customer
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      res.json({ message: 'Customer removed' });
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
