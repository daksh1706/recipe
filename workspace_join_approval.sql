-- Supabase SQL Migration Script
-- 
-- Run the following script inside your Supabase project's SQL Editor to enable 
-- the pending workspace join approval system.

-- Add the 'status' column to the 'workspace_members' table with 'pending', 'approved', or 'rejected' states.
-- Existing members will default to 'approved' to preserve their access.
ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update policy or permissions if needed
COMMENT ON COLUMN workspace_members.status IS 'Workspace member approval status for 6-digit sharing codes.';
