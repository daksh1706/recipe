-- Supabase SQL Migration Script
-- 
-- Run this inside your Supabase project's SQL Editor to update the menu item
-- category constraint to allow the new recipe classifications!

-- 1. Drop the old category CHECK constraint if it exists on menu_items
ALTER TABLE menu_items 
DROP CONSTRAINT IF EXISTS menu_items_category_check;

-- 2. Create the new CHECK constraint with the 11 updated categories
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

COMMENT ON COLUMN menu_items.category IS 'Unified coffee shop recipe classifications.';
