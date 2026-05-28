-- 1. Create Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_name TEXT NOT NULL,
  owner_id UUID, -- References users(id) - constraint added after users exist
  share_code TEXT UNIQUE NOT NULL, -- Hashed or obfuscated code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Workspace Members Table
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References users(id) - constraint added after users exist
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_workspace_member UNIQUE (workspace_id, user_id)
);

-- 3. Create Workspace Join Attempts Table (For Logging & Rate Limiting)
CREATE TABLE IF NOT EXISTS workspace_join_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL
);

-- 4. Alter 'users' Table to link to active workspace
ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- 5. Scope all 12 existing entities to a workspace_id
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

-- 6. Add references back to 'users' table since it is created globally
ALTER TABLE workspaces ADD CONSTRAINT fk_workspaces_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE workspace_members ADD CONSTRAINT fk_workspace_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. Seed Default Workspace (for seamless backward compatibility migration of orphaned records)
INSERT INTO workspaces (id, workspace_name, share_code)
VALUES ('00000000-0000-0000-0000-000000000000', 'CRFTD Main Workspace', 'e3a1f8bb64b58e2a') -- deterministic obfuscated 123456 code
ON CONFLICT (id) DO NOTHING;

-- 8. Backfill existing orphaned records (if any)
UPDATE users SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE menu_items SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE orders SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE customers SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE raw_materials SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE recipes SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE expenses SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE staff_roster SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE suppliers SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE waste_log SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE feedback SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE order_items SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;
UPDATE stock_transactions SET workspace_id = '00000000-0000-0000-0000-000000000000' WHERE workspace_id IS NULL;

-- 9. Enable RLS on all scoped tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_join_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- 10. Simple RLS policies so users only see their workspace data
CREATE POLICY workspaces_policy ON workspaces FOR ALL TO authenticated USING (
  id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY workspace_members_policy ON workspace_members FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY menu_items_policy ON menu_items FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY orders_policy ON orders FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY customers_policy ON customers FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY raw_materials_policy ON raw_materials FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY recipes_policy ON recipes FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY expenses_policy ON expenses FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY staff_roster_policy ON staff_roster FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY suppliers_policy ON suppliers FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY waste_log_policy ON waste_log FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY feedback_policy ON feedback FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY order_items_policy ON order_items FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY stock_transactions_policy ON stock_transactions FOR ALL TO authenticated USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
