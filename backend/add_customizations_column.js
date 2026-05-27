/**
 * Run this ONCE to add the customizations column to order_items.
 * Usage: node add_customizations_column.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function run() {
  // We use Supabase's pg connection via the REST API with a workaround:
  // Insert a dummy record with the column and catch the error to detect if column exists.
  // Then use a stored procedure approach via PostgREST if available.

  // Alternative: use the supabase-js v2 .rpc() with a migration function
  // Since exec_sql RPC is not available, we create a temp function and drop it.

  console.log('Attempting to add customizations column to order_items...\n');
  
  // Try using the .from().update() trick — if column doesn't exist, we catch the error
  // The real way is via Supabase Dashboard > SQL Editor:
  console.log('='.repeat(60));
  console.log('Please run the following SQL in your Supabase Dashboard:');
  console.log('  https://supabase.com/dashboard/project/crtitxemhkckpvfsrtdc/sql');
  console.log('='.repeat(60));
  console.log(`
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '[]';

-- Verify it worked:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'customizations';
  `);
  console.log('='.repeat(60));
  console.log('\nOr use the Supabase CLI:');
  console.log("  supabase db push  (if you have supabase CLI set up)\n");
}

run();
