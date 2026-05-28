-- ============================================================
-- MIGRATION: Fix Category & Unit Constraints for Full Recipe Seed
-- Run this in the Supabase SQL Editor BEFORE running setup_db.js
-- ============================================================

-- STEP 1: Fix Raw Materials Category Constraint
-- (Adds: chocolate_cocoa, fruits_veg, specialty, dry_goods)
ALTER TABLE raw_materials
  DROP CONSTRAINT IF EXISTS raw_materials_category_check;

ALTER TABLE raw_materials
  ADD CONSTRAINT raw_materials_category_check
  CHECK (category IN (
    'coffee_beans',
    'milk_dairy',
    'syrups_sauces',
    'bakery',
    'fruits',
    'packaging',
    'cleaning',
    'other',
    'chocolate_cocoa',
    'fruits_veg',
    'specialty',
    'dry_goods'
  ));

-- STEP 2: Fix Raw Materials Unit Constraint (add 'slice')
ALTER TABLE raw_materials
  DROP CONSTRAINT IF EXISTS raw_materials_unit_check;

ALTER TABLE raw_materials
  ADD CONSTRAINT raw_materials_unit_check
  CHECK (unit IN ('ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup', 'slice'));

-- STEP 3: Fix Recipe Ingredients Unit Constraint (add 'slice')
ALTER TABLE recipe_ingredients
  DROP CONSTRAINT IF EXISTS recipe_ingredients_unit_check;

ALTER TABLE recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_unit_check
  CHECK (unit IN ('ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup', 'slice'));

-- STEP 4: Fix Menu Items Category Constraint
ALTER TABLE menu_items
  DROP CONSTRAINT IF EXISTS menu_items_category_check;

ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_category_check
  CHECK (category IN (
    'espresso',
    'latte',
    'cappuccino',
    'mocha',
    'americano',
    'flat_white',
    'macchiato',
    'frappuccino',
    'cold_brew',
    'soda',
    'light_bites'
  ));

-- ============================================================
-- After this runs successfully, run from /backend:
--   node setup_db.js
-- This will seed:
--   - 70 raw materials (category-wise)
--   - 88 menu items with recipes & ingredients (category-wise)
-- ============================================================
