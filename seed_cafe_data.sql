-- ============================================================
-- SAMPLE DATA SEED: raw_materials, menu_items, recipes, recipe_ingredients
-- Run this script in Supabase SQL editor after workspace_id columns are added.
-- Adjust IDs, prices, and stock as needed.
-- ============================================================

-- Replace with your actual workspace UUID


-- 1. Raw Materials (ingredients)
INSERT INTO raw_materials (item_code, name, unit, current_stock, cost_per_unit, workspace_id)
VALUES
  ('RM001', 'Espresso coffee beans', 'kg', 10, 120.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM002', 'Whole milk', 'liter', 50, 1.20, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM003', 'Heavy cream', 'liter', 20, 2.50, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM004', 'Coconut cream', 'liter', 15, 3.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM005', 'Sweetened condensed milk', 'kg', 5, 4.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM006', 'Unsalted butter', 'kg', 8, 6.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM007', 'Vanilla syrup', 'liter', 12, 5.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM008', 'Caramel syrup', 'liter', 12, 5.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM009', 'Hazelnut syrup', 'liter', 10, 5.50, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM010', 'Rose syrup', 'liter', 8, 5.50, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM011', 'Chocolate sauce', 'liter', 10, 6.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM012', 'White chocolate sauce', 'liter', 8, 6.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM013', 'Cocoa powder', 'kg', 5, 8.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM014', 'Vanilla extract', 'ml', 500, 0.10, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM015', 'Eggs (whole)', 'unit', 200, 0.20, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM016', 'All-purpose flour', 'kg', 30, 1.50, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM017', 'Sugar', 'kg', 40, 0.80, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM018', 'Brown sugar', 'kg', 20, 1.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM019', 'Chocolate chips', 'kg', 10, 12.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('RM020', 'Swedish almond paste', 'kg', 5, 15.00, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1');

-- 2. Menu Items (recipes)
INSERT INTO menu_items (item_code, name, description, category, price, gst_percent, is_available, workspace_id)
VALUES
  ('MI001', 'Espresso', 'Classic espresso shot', 'espresso', 2.50, 5, true, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('MI002', 'Vanilla Latte', 'Smooth latte with vanilla syrup', 'latte', 3.50, 5, true, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('MI003', 'Caramel Cappuccino', 'Cappuccino with caramel syrup', 'cappuccino', 3.80, 5, true, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('MI004', 'Mocha', 'Espresso with chocolate sauce', 'mocha', 4.00, 5, true, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('MI005', 'Cold Brew Float', 'Cold brew topped with vanilla ice cream', 'cold_brew', 4.20, 5, true, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('MI006', 'Iced Americano', 'Cold water over espresso', 'soda', 2.80, 5, true, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'),
  ('MI007', 'Chocolate Brownie', 'Fudgy chocolate brownie', 'light_bites', 2.50, 5, true, '65b4bfed-57ed-4353-bf8d-710b3c3f4af1');

-- 3. Recipes (link to menu_items)
INSERT INTO recipes (menu_item_id, serving_size, prep_time_minutes, instructions, workspace_id)
SELECT id, 'Regular', 5, 'Standard preparation steps', '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' FROM menu_items WHERE item_code IN ('MI001','MI002','MI003','MI004','MI005','MI006','MI007');

-- 4. Recipe Ingredients (link raw_materials to recipes)
-- Example for Espresso (MI001)
INSERT INTO recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
SELECT r.id, rm.id, q.qty, q.unit
FROM recipes r
JOIN menu_items mi ON mi.id = r.menu_item_id
JOIN raw_materials rm ON rm.item_code = 'RM001'
CROSS JOIN (SELECT 18 AS qty, 'g' AS unit) q
WHERE mi.item_code = 'MI001';

-- Example for Vanilla Latte (MI002)
INSERT INTO recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
SELECT r.id, rm.id, q.qty, q.unit
FROM recipes r
JOIN menu_items mi ON mi.id = r.menu_item_id
JOIN raw_materials rm ON rm.item_code = 'RM001' -- espresso beans
CROSS JOIN (SELECT 18 AS qty, 'g' AS unit) q
WHERE mi.item_code = 'MI002';

INSERT INTO recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
SELECT r.id, rm.id, q.qty, q.unit
FROM recipes r
JOIN menu_items mi ON mi.id = r.menu_item_id
JOIN raw_materials rm ON rm.item_code = 'RM002' -- whole milk
CROSS JOIN (SELECT 150 AS qty, 'ml' AS unit) q
WHERE mi.item_code = 'MI002';

INSERT INTO recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
SELECT r.id, rm.id, q.qty, q.unit
FROM recipes r
JOIN menu_items mi ON mi.id = r.menu_item_id
JOIN raw_materials rm ON rm.item_code = 'RM007' -- vanilla syrup
CROSS JOIN (SELECT 15 AS qty, 'ml' AS unit) q
WHERE mi.item_code = 'MI002';

-- Add more recipe_ingredients as needed for other menu items.

-- ============================================================
-- After running, you should see menu items and inventory in the app.
-- ============================================================
