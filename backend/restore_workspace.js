import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function restoreWorkspace() {
  console.log('🔧 Starting workspace restoration for dakshmaru10@gmail.com...\n');

  // 1. Get the admin user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'dakshmaru10@gmail.com')
    .single();

  if (userErr || !user) {
    console.error('❌ Admin user not found:', userErr?.message);
    return;
  }
  console.log(`✅ Found admin user: ${user.email} (id: ${user.id})`);
  console.log(`   Current workspace_id: ${user.workspace_id ?? 'NULL'}`);

  // 2. Find workspace owned by this admin
  const { data: ownedWorkspace, error: wsErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  let workspace = ownedWorkspace;

  if (!workspace) {
    // Try the default workspace (id: 00000000-...)
    const { data: defaultWs } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .maybeSingle();

    if (defaultWs) {
      workspace = defaultWs;
      console.log(`\n⚠️  No owned workspace found. Using default workspace: "${workspace.workspace_name}"`);
      
      // Set admin as owner of default workspace
      await supabase
        .from('workspaces')
        .update({ owner_id: user.id })
        .eq('id', workspace.id);
      console.log('   Set admin as owner of default workspace.');
    } else {
      console.log('\n❌ No workspace found at all. Please check your Supabase database.');
      return;
    }
  } else {
    console.log(`\n✅ Found owned workspace: "${workspace.workspace_name}" (id: ${workspace.id})`);
  }

  // 3. Restore admin's workspace_id link
  const { error: linkErr } = await supabase
    .from('users')
    .update({ workspace_id: workspace.id })
    .eq('id', user.id);

  if (linkErr) {
    console.error('❌ Failed to link admin to workspace:', linkErr.message);
    return;
  }
  console.log(`✅ Linked admin user to workspace "${workspace.workspace_name}"`);

  // 4. Ensure admin is in workspace_members as 'owner'
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id, role, status')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: memberErr } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner', status: 'approved' });

    if (memberErr) {
      console.error('❌ Failed to add admin to workspace_members:', memberErr.message);
    } else {
      console.log('✅ Added admin to workspace_members as owner');
    }
  } else {
    // Update to owner + approved if needed
    await supabase
      .from('workspace_members')
      .update({ role: 'owner', status: 'approved' })
      .eq('id', existingMember.id);
    console.log(`✅ Admin already in workspace_members (role: ${existingMember.role}) — ensured owner+approved`);
  }

  // 5. Backfill all seeded data (menu_items, raw_materials, recipes, etc.) to this workspace
  console.log(`\n🔄 Backfilling seeded data to workspace "${workspace.workspace_name}"...`);
  
  const tables = [
    'menu_items', 'raw_materials', 'recipes', 'suppliers',
    'customers', 'orders', 'expenses', 'staff_roster',
    'waste_log', 'feedback', 'order_items', 'stock_transactions'
  ];

  for (const table of tables) {
    const { error, count } = await supabase
      .from(table)
      .update({ workspace_id: workspace.id })
      .is('workspace_id', null)
      .select('id', { count: 'exact', head: true });

    if (error) {
      // Some tables might not have workspace_id yet
      if (!error.message.includes('column') && !error.message.includes('does not exist')) {
        console.error(`  ⚠️  ${table}: ${error.message}`);
      }
    } else {
      console.log(`  ✅ ${table}: backfilled orphaned records`);
    }
  }

  // Also backfill recipe_ingredients (no workspace_id column, it inherits via recipe)
  console.log('\n✅ recipe_ingredients: inherits workspace via recipes table (no direct column)');

  console.log('\n🚀 Workspace restoration complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Workspace:  "${workspace.workspace_name}"`);
  console.log(`  Workspace ID: ${workspace.id}`);
  console.log(`  Admin email:  dakshmaru10@gmail.com`);
  console.log(`  Admin role:   owner`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n👉 You can now log in with dakshmaru10@gmail.com / Daksh@2006');
}

restoreWorkspace().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
