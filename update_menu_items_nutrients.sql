-- SQL Migration: Add Nutrients columns to menu_items
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/crtitxemhkckpvfsrtdc/sql

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories NUMERIC DEFAULT NULL CHECK (calories >= 0 OR calories IS NULL);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS carbs NUMERIC DEFAULT NULL CHECK (carbs >= 0 OR carbs IS NULL);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS protein NUMERIC DEFAULT NULL CHECK (protein >= 0 OR protein IS NULL);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS fat NUMERIC DEFAULT NULL CHECK (fat >= 0 OR fat IS NULL);

-- Refresh the PostgREST schema cache to ensure PostgREST learns about the new columns immediately
NOTIFY pgrst, 'reload schema';
