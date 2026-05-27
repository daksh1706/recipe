-- ============================================================
-- CRFTD POS — Inventory and Admin Access Migrations
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Dynamically drop any existing CHECK constraints on raw_materials.unit
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'raw_materials' 
          AND ccu.column_name = 'unit'
          AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE;';
    END LOOP;
END $$;

-- 2. Add updated CHECK constraint to support bottle, pouch, and pack
ALTER TABLE raw_materials 
  ADD CONSTRAINT raw_materials_unit_check 
  CHECK (unit IN ('ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup', 'bottle', 'pouch', 'pack'));

-- 3. Add quantity_per_pack and pack_capacity_unit columns if they do not exist
ALTER TABLE raw_materials 
  ADD COLUMN IF NOT EXISTS quantity_per_pack NUMERIC DEFAULT NULL;

ALTER TABLE raw_materials 
  ADD COLUMN IF NOT EXISTS pack_capacity_unit TEXT DEFAULT NULL;

-- 4. Verify/add a helper constraint to ensure quantity_per_pack is positive if set
ALTER TABLE raw_materials
  DROP CONSTRAINT IF EXISTS raw_materials_qty_pack_check;

ALTER TABLE raw_materials
  ADD CONSTRAINT raw_materials_qty_pack_check
  CHECK (quantity_per_pack IS NULL OR quantity_per_pack > 0);
