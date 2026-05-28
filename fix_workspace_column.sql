-- ============================================================
-- COMPLETE FIX: Add workspace_id columns + restore workspace
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- STEP 1: Add workspace_id to all tables that need it
ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE staff_roster ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE waste_log ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- STEP 2: Add status column to workspace_members (if not already there)
ALTER TABLE workspace_members
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- STEP 3: Clean up duplicate workspaces (keep only "Daksh Maru's Workspace")
DELETE FROM workspace_members
WHERE workspace_id IN (
  SELECT id FROM workspaces
  WHERE owner_id = '143d38be-0e9a-40b1-adf2-4e271c9dc876'
    AND id != '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'
);
DELETE FROM workspaces
WHERE owner_id = '143d38be-0e9a-40b1-adf2-4e271c9dc876'
  AND id != '65b4bfed-57ed-4353-bf8d-710b3c3f4af1';

-- STEP 4: Link admin user to their workspace
UPDATE users SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'
WHERE email = 'dakshmaru10@gmail.com';

-- STEP 5: Backfill all seeded data to admin's workspace
UPDATE menu_items SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE raw_materials SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE recipes SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE suppliers SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE customers SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE expenses SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE staff_roster SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE waste_log SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE orders SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE order_items SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE stock_transactions SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;
UPDATE feedback SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1' WHERE workspace_id IS NULL;

-- STEP 6: Link all staff users to this workspace
UPDATE users SET workspace_id = '65b4bfed-57ed-4353-bf8d-710b3c3f4af1'
WHERE workspace_id IS NULL
  AND email IN ('manager@coffee.com', 'barista@coffee.com', 'cashier@coffee.com', 'test@gmail.com');
