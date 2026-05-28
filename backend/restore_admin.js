import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function restoreAdmin() {
  console.log('🔧 Restoring admin access for dakshmaru10@gmail.com...');

  // 1. Fetch current user record (to preserve workspace_id and other fields)
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'dakshmaru10@gmail.com')
    .single();

  if (fetchErr || !user) {
    console.error('❌ User not found:', fetchErr?.message);
    return;
  }

  console.log('Found user:', user.email, '| workspace_id:', user.workspace_id);

  // 2. Re-hash the correct password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Daksh@2006', salt);

  // 3. Restore ONLY password, role, status, is_active — preserve workspace_id
  const { error: updateErr } = await supabase
    .from('users')
    .update({
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
      is_active: true,
      full_name: 'Daksh Maru',
      phone: '9876543210'
      // workspace_id is intentionally NOT touched — preserve existing value
    })
    .eq('email', 'dakshmaru10@gmail.com');

  if (updateErr) {
    console.error('❌ Failed to restore admin:', updateErr.message);
    return;
  }

  // 4. Verify the password works
  const { data: updatedUser } = await supabase
    .from('users')
    .select('id, email, role, status, workspace_id, is_active')
    .eq('email', 'dakshmaru10@gmail.com')
    .single();

  console.log('\n✅ Admin access restored!');
  console.log('  Email:        dakshmaru10@gmail.com');
  console.log('  Password:     Daksh@2006');
  console.log('  Role:         admin');
  console.log('  Status:       approved');
  console.log('  workspace_id:', updatedUser?.workspace_id ?? '(none — will be set on next login)');
  console.log('\n📌 If workspace_id is null, log in and re-create or re-join the workspace.');
}

restoreAdmin().catch(err => console.error('Error:', err.message));
