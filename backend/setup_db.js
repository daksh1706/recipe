import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function seed() {
  console.log("🌱 Starting Database Seeding...");

  // 1. Seed Users (Admin, Manager, Barista, Cashier)
  console.log("Seeding Users...");
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Daksh@2006', salt);
  const genericPassword = await bcrypt.hash('password123', salt);

  const usersToSeed = [
    {
      email: 'dakshmaru10@gmail.com',
      password: adminPassword,
      full_name: 'Daksh Maru',
      role: 'admin',
      phone: '9876543210',
      status: 'approved',
      is_active: true
    },
    {
      email: 'manager@coffee.com',
      password: genericPassword,
      full_name: 'Jane Manager',
      role: 'manager',
      phone: '9876543211',
      status: 'approved',
      is_active: true
    },
    {
      email: 'barista@coffee.com',
      password: genericPassword,
      full_name: 'Bob Barista',
      role: 'barista',
      phone: '9876543212',
      status: 'approved',
      is_active: true
    },
    {
      email: 'cashier@coffee.com',
      password: genericPassword,
      full_name: 'Charlie Cashier',
      role: 'cashier',
      phone: '9876543213',
      status: 'approved',
      is_active: true
    },
    {
      email: 'test@gmail.com',
      password: genericPassword,
      full_name: 'Demo Test Account',
      role: 'admin',
      phone: '9999999999',
      status: 'approved',
      is_active: true
    }
  ];

  const seededUsers = [];
  for (const u of usersToSeed) {
    const { data, error } = await supabase
      .from('users')
      .upsert(u, { onConflict: 'email' })
      .select();

    if (error) {
      console.error(`Error seeding user ${u.email}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`User seeded: ${u.email} (${data[0].role})`);
      seededUsers.push(data[0]);
    }
  }

  // 2. Seed Suppliers
  console.log("\nSeeding Suppliers...");
  const suppliersToSeed = [
    {
      name: 'Arabica Coffee Traders',
      contact_person: 'John Doe',
      phone: '9123456780',
      email: 'sales@arabicatrades.com',
      address: '101 Coffee Estate, Chikmagalur, Karnataka',
      items_supplied: 'Coffee Beans, Syrups',
      payment_terms: 'Net 30',
      delivery_days: 'Monday, Thursday',
      minimum_order_quantity: 5,
      notes: 'Premium single-origin beans'
    },
    {
      name: 'Dairy Fresh Cooperatives',
      contact_person: 'Alice Smith',
      phone: '9123456781',
      email: 'orders@dairyfresh.com',
      address: '42 Meadow Lane, Anand, Gujarat',
      items_supplied: 'Milk, Cream, Butter',
      payment_terms: 'Cash on Delivery',
      delivery_days: 'Daily',
      minimum_order_quantity: 10,
      notes: 'Local organic milk'
    }
  ];

  const seededSuppliers = [];
  for (const s of suppliersToSeed) {
    const { data, error } = await supabase
      .from('suppliers')
      .upsert(s, { onConflict: 'name' })
      .select();

    if (error) {
      console.error(`Error seeding supplier ${s.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Supplier seeded: ${s.name}`);
      seededSuppliers.push(data[0]);
    }
  }

  // Get Supplier IDs
  const arabicaSupId = seededSuppliers.find(s => s.name === 'Arabica Coffee Traders')?.id;
  const dairySupId = seededSuppliers.find(s => s.name === 'Dairy Fresh Cooperatives')?.id;

  // 3. Seed Raw Materials (Inventory Items)
  console.log("\nSeeding Raw Materials...");
  const rawMaterialsToSeed = [
    {
      item_code: 'RM-COF-001',
      name: 'Espresso Roast Beans',
      category: 'coffee_beans',
      unit: 'g',
      current_stock: 12500, // 12.5 kg
      minimum_stock_level: 2000,
      reorder_quantity: 10000,
      cost_per_unit: 0.95, // 0.95 INR per gram
      supplier_id: arabicaSupId,
      storage_location: 'Dry Pantry Shelf A',
      expiry_date: '2026-12-31'
    },
    {
      item_code: 'RM-MLK-002',
      name: 'Whole Milk',
      category: 'milk_dairy',
      unit: 'ml',
      current_stock: 45000, // 45 Liters
      minimum_stock_level: 10000,
      reorder_quantity: 30000,
      cost_per_unit: 0.065, // 0.065 INR per ml (65 INR per Liter)
      supplier_id: dairySupId,
      storage_location: 'Cold Fridge Row 1',
      expiry_date: '2026-06-05'
    },
    {
      item_code: 'RM-SYR-003',
      name: 'Vanilla Syrup',
      category: 'syrups_sauces',
      unit: 'ml',
      current_stock: 5000, // 5 Bottles of 1L
      minimum_stock_level: 1000,
      reorder_quantity: 4000,
      cost_per_unit: 0.45,
      supplier_id: arabicaSupId,
      storage_location: 'Under POS Syrup Shelf',
      expiry_date: '2027-02-28'
    },
    {
      item_code: 'RM-SYR-004',
      name: 'Caramel Sauce',
      category: 'syrups_sauces',
      unit: 'ml',
      current_stock: 800, // 800 ml
      minimum_stock_level: 1000, // Trigger low stock!
      reorder_quantity: 5000,
      cost_per_unit: 0.60,
      supplier_id: arabicaSupId,
      storage_location: 'Under POS Syrup Shelf',
      expiry_date: '2027-01-15'
    },
    {
      item_code: 'RM-BAK-005',
      name: 'Butter Croissants',
      category: 'bakery',
      unit: 'piece',
      current_stock: 24,
      minimum_stock_level: 8,
      reorder_quantity: 24,
      cost_per_unit: 45.0, // 45 INR per piece
      storage_location: 'Pastry Showcase Cabinet',
      expiry_date: '2026-05-29'
    }
  ];

  const seededRawMaterials = [];
  for (const r of rawMaterialsToSeed) {
    const { data, error } = await supabase
      .from('raw_materials')
      .upsert(r, { onConflict: 'item_code' })
      .select();

    if (error) {
      console.error(`Error seeding raw material ${r.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Raw Material seeded: ${r.name}`);
      seededRawMaterials.push(data[0]);
    }
  }

  // 4. Seed Menu Items
  console.log("\nSeeding Menu Items...");
  const menuItemsToSeed = [
    {
      item_code: 'MENU-ESP-001',
      name: 'Double Espresso',
      description: 'Bold, rich double shot of our premium espresso roast.',
      category: 'hot_coffee',
      price: 120.0,
      gst_percent: 5.0,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1510707577719-07f1b69c2ee9?q=80&w=300&auto=format&fit=crop'
    },
    {
      item_code: 'MENU-CAP-002',
      name: 'Classic Cappuccino',
      description: 'Rich espresso layered with warm textured milk and velvety foam.',
      category: 'hot_coffee',
      price: 160.0,
      gst_percent: 5.0,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=300&auto=format&fit=crop'
    },
    {
      item_code: 'MENU-MAC-003',
      name: 'Iced Caramel Macchiato',
      description: 'Espresso combined with vanilla-flavored syrup, milk and caramel drizzle over ice.',
      category: 'cold_coffee',
      price: 210.0,
      gst_percent: 5.0,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=300&auto=format&fit=crop'
    },
    {
      item_code: 'MENU-CRO-004',
      name: 'Butter Croissant',
      description: 'Flaky, buttery classic French pastry served warm.',
      category: 'light_bites',
      price: 90.0,
      gst_percent: 5.0,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=300&auto=format&fit=crop'
    }
  ];

  const seededMenuItems = [];
  for (const m of menuItemsToSeed) {
    const { data, error } = await supabase
      .from('menu_items')
      .upsert(m, { onConflict: 'item_code' })
      .select();

    if (error) {
      console.error(`Error seeding menu item ${m.name}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Menu Item seeded: ${m.name}`);
      seededMenuItems.push(data[0]);
    }
  }

  // 5. Seed Recipes & Ingredients Mapping
  console.log("\nSeeding Recipes and Ingredients...");
  
  // Find item IDs
  const espId = seededMenuItems.find(m => m.item_code === 'MENU-ESP-001')?.id;
  const capId = seededMenuItems.find(m => m.item_code === 'MENU-CAP-002')?.id;
  const macId = seededMenuItems.find(m => m.item_code === 'MENU-MAC-003')?.id;
  const croId = seededMenuItems.find(m => m.item_code === 'MENU-CRO-004')?.id;

  const rawBeansId = seededRawMaterials.find(r => r.item_code === 'RM-COF-001')?.id;
  const rawMilkId = seededRawMaterials.find(r => r.item_code === 'RM-MLK-002')?.id;
  const rawVanillaId = seededRawMaterials.find(r => r.item_code === 'RM-SYR-003')?.id;
  const rawCaramelId = seededRawMaterials.find(r => r.item_code === 'RM-SYR-004')?.id;
  const rawCroissantPieceId = seededRawMaterials.find(r => r.item_code === 'RM-BAK-005')?.id;

  const recipesToSeed = [
    {
      menu_item_id: espId,
      serving_size: 'Double Shot',
      prep_time_minutes: 2,
      instructions: '1. Grind 18g espresso beans.\n2. Tamp evenly into portafilter.\n3. Pull 36g espresso liquid in 25-30 seconds.'
    },
    {
      menu_item_id: capId,
      serving_size: 'Regular 250ml',
      prep_time_minutes: 3,
      instructions: '1. Grind 18g beans, pull double shot espresso.\n2. Steam 150ml milk creating nice microfoam.\n3. Pour textured milk over espresso creating a classic dome foam.'
    },
    {
      menu_item_id: macId,
      serving_size: 'Large 400ml',
      prep_time_minutes: 4,
      instructions: '1. Add 15ml vanilla syrup to glass.\n2. Add ice cubes to fill 3/4 glass.\n3. Pour 200ml whole milk.\n4. Float double espresso shot on top.\n5. Drizzle 15ml rich caramel sauce in crosshatch pattern.'
    },
    {
      menu_item_id: croId,
      serving_size: '1 Piece',
      prep_time_minutes: 2,
      instructions: '1. Heat butter croissant in preheated convection oven at 180°C for 2 minutes.\n2. Plate neatly and serve warm.'
    }
  ];

  for (const r of recipesToSeed) {
    if (!r.menu_item_id) continue;
    // Check if recipe exists
    const { data: existing } = await supabase.from('recipes').select('id').eq('menu_item_id', r.menu_item_id).limit(1);
    
    let recipeId;
    if (existing && existing.length > 0) {
      recipeId = existing[0].id;
      await supabase.from('recipes').update(r).eq('id', recipeId);
      console.log(`Recipe updated for menu item ID ${r.menu_item_id}`);
    } else {
      const { data: newRecipe } = await supabase.from('recipes').insert(r).select().single();
      recipeId = newRecipe?.id;
      console.log(`Recipe created for menu item ID ${r.menu_item_id}`);
    }

    if (!recipeId) continue;

    // Seed ingredients for recipes
    // Clear out old ingredients to recreate cleanly
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);

    const ingredientsMap = [];
    if (r.menu_item_id === espId) {
      ingredientsMap.push({ recipe_id: recipeId, raw_material_id: rawBeansId, quantity: 18.0, unit: 'g' });
    } else if (r.menu_item_id === capId) {
      ingredientsMap.push(
        { recipe_id: recipeId, raw_material_id: rawBeansId, quantity: 18.0, unit: 'g' },
        { recipe_id: recipeId, raw_material_id: rawMilkId, quantity: 150.0, unit: 'ml' }
      );
    } else if (r.menu_item_id === macId) {
      ingredientsMap.push(
        { recipe_id: recipeId, raw_material_id: rawBeansId, quantity: 18.0, unit: 'g' },
        { recipe_id: recipeId, raw_material_id: rawMilkId, quantity: 200.0, unit: 'ml' },
        { recipe_id: recipeId, raw_material_id: rawVanillaId, quantity: 15.0, unit: 'ml' },
        { recipe_id: recipeId, raw_material_id: rawCaramelId, quantity: 15.0, unit: 'ml' }
      );
    } else if (r.menu_item_id === croId) {
      ingredientsMap.push({ recipe_id: recipeId, raw_material_id: rawCroissantPieceId, quantity: 1.0, unit: 'piece' });
    }

    if (ingredientsMap.length > 0) {
      const { error } = await supabase.from('recipe_ingredients').insert(ingredientsMap);
      if (error) {
        console.error(`Error inserting recipe ingredients:`, error.message);
      } else {
        console.log(`Seeded ${ingredientsMap.length} ingredients for recipe ID ${recipeId}`);
      }
    }
  }

  // 6. Seed Customers
  console.log("\nSeeding Customers...");
  const customersToSeed = [
    {
      name: 'Rahul Sharma',
      phone: '9876543220',
      email: 'rahul.sharma@gmail.com',
      total_visits: 12, // VIP Gold Star Trigger!
      total_spent: 2450.0,
      notes: 'Loves extra hot classic cappuccino'
    },
    {
      name: 'Aditi Rao',
      phone: '9876543221',
      email: 'aditi.rao@yahoo.com',
      total_visits: 4,
      total_spent: 860.0,
      notes: 'Prefers almond milk lattes'
    }
  ];

  for (const c of customersToSeed) {
    await supabase.from('customers').upsert(c, { onConflict: 'phone' });
    console.log(`Customer seeded: ${c.name}`);
  }

  // 7. Seed Staff Roster
  console.log("\nSeeding Staff Roster...");
  const baristaUser = seededUsers.find(u => u.email === 'barista@coffee.com');
  const cashierUser = seededUsers.find(u => u.email === 'cashier@coffee.com');

  if (baristaUser) {
    await supabase.from('staff_roster').upsert({
      user_id: baristaUser.id,
      role: 'barista',
      shift: 'morning',
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      monthly_salary: 22000.0,
      emergency_contact: '9999998888',
      is_active: true
    }, { onConflict: 'user_id' });
    console.log("Seeded staff roster for Barista Bob");
  }

  if (cashierUser) {
    await supabase.from('staff_roster').upsert({
      user_id: cashierUser.id,
      role: 'cashier',
      shift: 'evening',
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
      monthly_salary: 18000.0,
      emergency_contact: '9999997777',
      is_active: true
    }, { onConflict: 'user_id' });
    console.log("Seeded staff roster for Cashier Charlie");
  }

  // 8. Seed Expenses
  console.log("\nSeeding Expenses...");
  const adminUser = seededUsers.find(u => u.email === 'dakshmaru10@gmail.com');
  if (adminUser) {
    const expensesToSeed = [
      {
        category: 'rent',
        description: 'Monthly coffee shop rental space fee',
        amount: 25000.0,
        payment_method: 'bank_transfer', // mapped to bank/card/upi
        paid_to: 'RealEstate Holdings Ltd',
        recorded_by: adminUser.id,
        created_at: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      },
      {
        category: 'electricity',
        description: 'Commercial electricity bill payment',
        amount: 8500.0,
        payment_method: 'card',
        paid_to: 'State Electricity Board',
        recorded_by: adminUser.id,
        created_at: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString()
      }
    ];

    // Seed if none exist
    const { count } = await supabase.from('expenses').select('*', { count: 'exact', head: true });
    if (count === 0) {
      await supabase.from('expenses').insert(expensesToSeed);
      console.log("Seeded two initial expenses.");
    }
  }

  console.log("\n🚀 Database seeding complete! Coffee shop management tables initialized.");
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err.message);
});
