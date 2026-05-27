-- Supabase Schema for Coffee Shop Management System

-- Drop tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS staff_roster CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS waste_log CASCADE;
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS raw_materials CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Added for custom Node/Express JWT authentication
  full_name TEXT,
  role TEXT DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'barista', 'cashier', 'waiter')),
  phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), -- for admin validation
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Menu Items Table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('hot_coffee', 'cold_coffee', 'frappuccino', 'soda', 'light_bites', 'savoury_bites')),
  price NUMERIC NOT NULL CHECK (price >= 0),
  gst_percent NUMERIC NOT NULL DEFAULT 5.0 CHECK (gst_percent >= 0),
  is_available BOOLEAN DEFAULT true,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Suppliers Table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  items_supplied TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  delivery_days TEXT DEFAULT '',
  minimum_order_quantity NUMERIC DEFAULT 0.0 CHECK (minimum_order_quantity >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Raw Materials Table
CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coffee_beans', 'milk_dairy', 'syrups_sauces', 'bakery', 'fruits', 'packaging', 'cleaning', 'other')),
  unit TEXT NOT NULL CHECK (unit IN ('ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup')),
  current_stock NUMERIC DEFAULT 0.0 CHECK (current_stock >= 0),
  minimum_stock_level NUMERIC DEFAULT 10.0 CHECK (minimum_stock_level >= 0),
  reorder_quantity NUMERIC DEFAULT 50.0 CHECK (reorder_quantity >= 0),
  cost_per_unit NUMERIC DEFAULT 0.0 CHECK (cost_per_unit >= 0),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  storage_location TEXT DEFAULT '',
  expiry_date DATE,
  last_restocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Recipes Table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  serving_size TEXT DEFAULT 'Regular',
  prep_time_minutes INTEGER DEFAULT 5 CHECK (prep_time_minutes >= 0),
  instructions TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Recipe Ingredients Table
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL CHECK (unit IN ('ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup'))
);

-- 7. Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT DEFAULT '',
  first_visit_date DATE DEFAULT CURRENT_DATE,
  last_visit_date DATE DEFAULT CURRENT_DATE,
  total_visits INTEGER DEFAULT 1 CHECK (total_visits >= 0),
  total_spent NUMERIC DEFAULT 0.0 CHECK (total_spent >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE NOT NULL, -- Format 'ORD-XXXX'
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  table_number INTEGER DEFAULT NULL CHECK (table_number >= 0 OR table_number IS NULL),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  discount_percent NUMERIC DEFAULT 0.0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount NUMERIC DEFAULT 0.0 CHECK (discount_amount >= 0),
  gst_amount NUMERIC DEFAULT 0.0 CHECK (gst_amount >= 0),
  grand_total NUMERIC NOT NULL CHECK (grand_total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  amount_received NUMERIC DEFAULT 0.0 CHECK (amount_received >= 0),
  change_to_return NUMERIC DEFAULT 0.0 CHECK (change_to_return >= 0),
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0)
);

-- 10. Stock Transactions Table
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deduction', 'restock', 'waste')),
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  reference_id UUID DEFAULT NULL, -- order_id or waste_log_id
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Waste Log Table
CREATE TABLE waste_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('expired', 'overcooked', 'dropped', 'unsold', 'spoiled', 'other')),
  estimated_loss NUMERIC NOT NULL DEFAULT 0.0 CHECK (estimated_loss >= 0),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('rent', 'electricity', 'staff_salary', 'raw_materials', 'packaging', 'equipment', 'marketing', 'maintenance', 'miscellaneous')),
  description TEXT DEFAULT '',
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card')),
  paid_to TEXT DEFAULT '',
  receipt_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Feedback Table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  action_taken TEXT DEFAULT '',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Staff Roster Table
CREATE TABLE staff_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'evening', 'full_day')),
  working_days TEXT[] NOT NULL DEFAULT '{}', -- array of days, e.g. ['Monday', 'Tuesday']
  monthly_salary NUMERIC NOT NULL CHECK (monthly_salary >= 0),
  joining_date DATE DEFAULT CURRENT_DATE,
  emergency_contact TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_menu_items_code ON menu_items(item_code);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON raw_materials(item_code);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_order ON feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_staff_roster_user ON staff_roster(user_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_roster ENABLE ROW LEVEL SECURITY;

-- For direct Server backend connections via service_role key, RLS is bypassed.
-- To allow direct frontend reads for menu items, create public SELECT policies:
CREATE POLICY "Allow public select for menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public select for recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Allow public select for recipe_ingredients" ON recipe_ingredients FOR SELECT USING (true);

-- Create open policies for simplicity in demo or direct Supabase connection state
CREATE POLICY "Allow all actions for authenticated users on users" ON users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on menu_items" ON menu_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on suppliers" ON suppliers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on raw_materials" ON raw_materials FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on recipes" ON recipes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on recipe_ingredients" ON recipe_ingredients FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on customers" ON customers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on orders" ON orders FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on order_items" ON order_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on stock_transactions" ON stock_transactions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on waste_log" ON waste_log FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on expenses" ON expenses FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on feedback" ON feedback FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on staff_roster" ON staff_roster FOR ALL TO public USING (true) WITH CHECK (true);
