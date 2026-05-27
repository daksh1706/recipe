/**
 * CRFTD POS — Add / Update Admin User
 * ------------------------------------
 * Usage:  node add_admin_user.js  <email>  <password>  <full_name>
 * Example: node add_admin_user.js cofounder@crftd.in SecurePass@123 "Rahul Sharma"
 *
 * If no args are provided, the defaults below are used.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

// ── Configurable via CLI args ────────────────────────────────────────────────
const email    = (process.argv[2] || 'cofounder@crftd.in').toLowerCase();
const password = process.argv[3] || 'ChangeMe@123';
const fullName = process.argv[4] || 'Co-Founder';
// ─────────────────────────────────────────────────────────────────────────────

async function createAdmin() {
  console.log(`\n🔧  Creating/updating admin account for: ${email}\n`);

  // 1. Hash the password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 2. Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    console.log(`⚠️   User already exists (id: ${existing.id}) — updating to admin + approved.`);
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        role: 'admin',
        status: 'approved',
        is_active: true,
        full_name: fullName
      })
      .eq('id', existing.id);

    if (updateErr) {
      console.error('❌  Update failed:', updateErr.message);
      process.exit(1);
    }

    console.log('✅  Existing user upgraded to Admin + approved status!');
  } else {
    // 3. Insert new admin user
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        full_name: fullName,
        role: 'admin',
        status: 'approved',
        is_active: true,
        phone: ''
      })
      .select()
      .single();

    if (insertErr) {
      console.error('❌  Insert failed:', insertErr.message);
      process.exit(1);
    }

    console.log('✅  New admin user created successfully!', {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status
    });
  }

  console.log('\n📋  Login credentials to share with your co-founder:');
  console.log(`   URL      : https://recipe-taupe-one.vercel.app`);
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`   Role     : Admin (full access)\n`);
  console.log('⚠️   Ask your co-founder to change their password after first login via Settings.\n');
}

createAdmin().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
