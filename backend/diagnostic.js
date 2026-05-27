import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function diagnose() {
  console.log("🔍 Diagnosing Supabase Database...");
  console.log("Supabase URL:", process.env.SUPABASE_URL);

  // 1. Fetch all tables in the public schema
  console.log("\n--- Checking Existing Tables ---");
  const { data: tables, error: tableErr } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  // Use SQL RPC if available or fetch from metadata
  const { data: listTables, error: listErr } = await supabase.rpc('get_tables');
  if (listErr) {
    console.log("Could not fetch table list via RPC:", listErr.message);
  } else {
    console.log("Tables:", listTables);
  }

  // Fallback check: let's query raw tables using a standard fetch or table list query if possible
  // Let's check table existence by trying to select from them
  const tablesToCheck = ['users', 'menu_items', 'recipes', 'recipe_ingredients', 'raw_materials', 'suppliers', 'customers'];
  for (const t of tablesToCheck) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`❌ Table '${t}' check failed:`, error.message);
    } else {
      console.log(`✅ Table '${t}' exists!`);
    }
  }

  // 2. Check users columns
  console.log("\n--- Checking 'users' Table Columns ---");
  const { data: userData, error: userErr } = await supabase.from('users').select('*').limit(1);
  if (userErr) {
    console.log("Error querying users table:", userErr.message);
  } else if (userData && userData.length > 0) {
    console.log("Sample user record columns:", Object.keys(userData[0]));
  } else {
    console.log("Users table is empty, trying to fetch columns by inserting a dummy record or using generic select");
  }
}

diagnose();
