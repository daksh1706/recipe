import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function fixConstraints() {
  console.log('🔧 Fixing database constraints...');

  // We'll use the Supabase Management API directly via fetch to run raw SQL
  const supabaseRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  
  const sqlStatements = [
    // Fix raw_materials category constraint
    `ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS raw_materials_category_check`,
    `ALTER TABLE raw_materials ADD CONSTRAINT raw_materials_category_check CHECK (category IN ('coffee_beans', 'milk_dairy', 'syrups_sauces', 'bakery', 'fruits', 'packaging', 'cleaning', 'other', 'chocolate_cocoa', 'fruits_veg', 'specialty', 'dry_goods', 'milk', 'dairy', 'syrups', 'sauces'))`,
    // Fix raw_materials unit constraint (add slice)
    `ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS raw_materials_unit_check`,
    `ALTER TABLE raw_materials ADD CONSTRAINT raw_materials_unit_check CHECK (unit IN ('ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup', 'slice'))`,
    // Fix recipe_ingredients unit constraint (add slice)
    `ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_unit_check`,
    `ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_unit_check CHECK (unit IN ('ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup', 'slice'))`,
    // Fix menu_items category constraint
    `ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_check`,
    `ALTER TABLE menu_items ADD CONSTRAINT menu_items_category_check CHECK (category IN ('espresso', 'latte', 'cappuccino', 'mocha', 'americano', 'flat_white', 'macchiato', 'frappuccino', 'cold_brew', 'soda', 'light_bites', 'pasta', 'sandwich', 'hot_chocolate'))`,
  ];

  for (const sql of sqlStatements) {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error(`❌ Failed: ${sql.substring(0, 60)}...`);
      console.error(`   Error: ${err}`);
    } else {
      console.log(`✅ Done: ${sql.substring(0, 60)}...`);
    }
  }

  console.log('\n🚀 Constraints fixed! Now run: node setup_db.js');
}

fixConstraints().catch(err => console.error('Error:', err.message));
