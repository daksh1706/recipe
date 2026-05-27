import { supabase } from '../config/supabase.js';

export const getSuppliers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw error;

    const mapped = data.map(s => ({
      ...s,
      _id: s.id,
      contactPerson: s.contact_person,
      itemsSupplied: s.items_supplied,
      paymentTerms: s.payment_terms,
      deliveryDays: s.delivery_days,
      minimumOrderQuantity: Number(s.minimum_order_quantity || 0)
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch raw materials supplied by them
    const { data: rawMaterials, error: matErr } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('supplier_id', id);

    if (matErr) throw matErr;

    const mapped = {
      ...supplier,
      _id: supplier.id,
      contactPerson: supplier.contact_person,
      itemsSupplied: supplier.items_supplied,
      paymentTerms: supplier.payment_terms,
      deliveryDays: supplier.delivery_days,
      minimumOrderQuantity: Number(supplier.minimum_order_quantity || 0),
      rawMaterials: rawMaterials.map(m => ({
        ...m,
        _id: m.id,
        itemCode: m.item_code,
        currentStock: Number(m.current_stock || 0),
        costPerUnit: Number(m.cost_per_unit || 0)
      }))
    };

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addSupplier = async (req, res) => {
  const { name, contactPerson, contact_person, phone, email, address, itemsSupplied, items_supplied, paymentTerms, payment_terms, deliveryDays, delivery_days, minimumOrderQuantity, minimum_order_quantity, notes } = req.body;
  
  try {
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        name,
        contact_person: contactPerson || contact_person || '',
        phone: phone || '',
        email: email || '',
        address: address || '',
        items_supplied: itemsSupplied || items_supplied || '',
        payment_terms: paymentTerms || payment_terms || '',
        delivery_days: deliveryDays || delivery_days || '',
        minimum_order_quantity: Number(minimumOrderQuantity || minimum_order_quantity || 0),
        notes: notes || ''
      })
      .select()
      .single();

    if (error) throw error;

    const mapped = {
      ...supplier,
      _id: supplier.id,
      contactPerson: supplier.contact_person,
      itemsSupplied: supplier.items_supplied,
      paymentTerms: supplier.payment_terms,
      deliveryDays: supplier.delivery_days,
      minimumOrderQuantity: Number(supplier.minimum_order_quantity || 0)
    };

    res.status(201).json(mapped);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, contact_person, phone, email, address, itemsSupplied, items_supplied, paymentTerms, payment_terms, deliveryDays, delivery_days, minimumOrderQuantity, minimum_order_quantity, notes } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (contactPerson !== undefined) updates.contact_person = contactPerson;
  else if (contact_person !== undefined) updates.contact_person = contact_person;

  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (address !== undefined) updates.address = address;

  if (itemsSupplied !== undefined) updates.items_supplied = itemsSupplied;
  else if (items_supplied !== undefined) updates.items_supplied = items_supplied;

  if (paymentTerms !== undefined) updates.payment_terms = paymentTerms;
  else if (payment_terms !== undefined) updates.payment_terms = payment_terms;

  if (deliveryDays !== undefined) updates.delivery_days = deliveryDays;
  else if (delivery_days !== undefined) updates.delivery_days = delivery_days;

  if (minimumOrderQuantity !== undefined) updates.minimum_order_quantity = Number(minimumOrderQuantity);
  else if (minimum_order_quantity !== undefined) updates.minimum_order_quantity = Number(minimum_order_quantity);

  if (notes !== undefined) updates.notes = notes;

  try {
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const mapped = {
      ...supplier,
      _id: supplier.id,
      contactPerson: supplier.contact_person,
      itemsSupplied: supplier.items_supplied,
      paymentTerms: supplier.payment_terms,
      deliveryDays: supplier.delivery_days,
      minimumOrderQuantity: Number(supplier.minimum_order_quantity || 0)
    };

    res.json(mapped);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      res.json({ message: 'Supplier removed' });
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
