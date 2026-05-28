import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

// List of all ingredients and machines (to be seeded into raw_materials table)
const rawMaterialsData = [
  // 1. COFFEE & ESPRESSO (coffee_beans)
  { item_code: 'RM-ING-001', name: 'Espresso coffee beans', category: 'coffee_beans', unit: 'kg', current_stock: 50.0, cost_per_unit: 800.0 },
  { item_code: 'RM-ING-002', name: 'Coarse ground dark roast coffee', category: 'coffee_beans', unit: 'kg', current_stock: 30.0, cost_per_unit: 750.0 },
  { item_code: 'RM-ING-003', name: 'Instant espresso powder', category: 'coffee_beans', unit: 'kg', current_stock: 5.0, cost_per_unit: 1200.0 },

  // 2. DAIRY & DAIRY ALTERNATIVES (milk / dairy)
  { item_code: 'RM-ING-004', name: 'Whole milk', category: 'milk', unit: 'l', current_stock: 200.0, cost_per_unit: 60.0 },
  { item_code: 'RM-ING-005', name: 'Heavy cream / double cream', category: 'milk', unit: 'l', current_stock: 50.0, cost_per_unit: 250.0 },
  { item_code: 'RM-ING-006', name: 'Coconut cream', category: 'milk', unit: 'l', current_stock: 30.0, cost_per_unit: 180.0 },
  { item_code: 'RM-ING-007', name: 'Sweetened condensed milk', category: 'dairy', unit: 'kg', current_stock: 40.0, cost_per_unit: 150.0 },
  { item_code: 'RM-ING-008', name: 'Unsalted butter', category: 'dairy', unit: 'kg', current_stock: 25.0, cost_per_unit: 500.0 },
  { item_code: 'RM-ING-009', name: 'Whipped cream', category: 'dairy', unit: 'kg', current_stock: 15.0, cost_per_unit: 350.0 },
  { item_code: 'RM-ING-010', name: 'Vanilla ice cream', category: 'dairy', unit: 'kg', current_stock: 20.0, cost_per_unit: 220.0 },
  { item_code: 'RM-ING-011', name: 'Chocolate ice cream', category: 'dairy', unit: 'kg', current_stock: 10.0, cost_per_unit: 240.0 },

  // 3. CHOCOLATE & COFFEE SAUCE (sauces / chocolate_cocoa)
  { item_code: 'RM-ING-012', name: 'Dark chocolate (70% cocoa)', category: 'chocolate_cocoa', unit: 'kg', current_stock: 15.0, cost_per_unit: 600.0 },
  { item_code: 'RM-ING-013', name: 'Milk chocolate', category: 'chocolate_cocoa', unit: 'kg', current_stock: 10.0, cost_per_unit: 550.0 },
  { item_code: 'RM-ING-014', name: 'White chocolate', category: 'chocolate_cocoa', unit: 'kg', current_stock: 8.0, cost_per_unit: 650.0 },
  { item_code: 'RM-ING-015', name: 'Chocolate sauce (ready-made)', category: 'sauces', unit: 'l', current_stock: 20.0, cost_per_unit: 280.0 },
  { item_code: 'RM-ING-016', name: 'White chocolate sauce', category: 'sauces', unit: 'l', current_stock: 10.0, cost_per_unit: 320.0 },
  { item_code: 'RM-ING-017', name: 'Cocoa powder', category: 'chocolate_cocoa', unit: 'kg', current_stock: 10.0, cost_per_unit: 450.0 },

  // 4. SYRUPS & SAUCES (syrups / sauces)
  { item_code: 'RM-ING-018', name: 'Vanilla syrup', category: 'syrups', unit: 'l', current_stock: 25.0, cost_per_unit: 350.0 },
  { item_code: 'RM-ING-019', name: 'Caramel syrup', category: 'syrups', unit: 'l', current_stock: 25.0, cost_per_unit: 350.0 },
  { item_code: 'RM-ING-020', name: 'Caramel sauce (thick)', category: 'sauces', unit: 'l', current_stock: 15.0, cost_per_unit: 400.0 },
  { item_code: 'RM-ING-021', name: 'Hazelnut syrup', category: 'syrups', unit: 'l', current_stock: 20.0, cost_per_unit: 380.0 },
  { item_code: 'RM-ING-022', name: 'Rose syrup', category: 'syrups', unit: 'l', current_stock: 12.0, cost_per_unit: 360.0 },
  { item_code: 'RM-ING-023', name: 'Lavender syrup', category: 'syrups', unit: 'l', current_stock: 12.0, cost_per_unit: 360.0 },
  { item_code: 'RM-ING-024', name: 'Brown sugar syrup', category: 'syrups', unit: 'l', current_stock: 15.0, cost_per_unit: 300.0 },
  { item_code: 'RM-ING-025', name: 'Toffee syrup', category: 'syrups', unit: 'l', current_stock: 10.0, cost_per_unit: 380.0 },
  { item_code: 'RM-ING-026', name: 'Strawberry syrup', category: 'syrups', unit: 'l', current_stock: 15.0, cost_per_unit: 320.0 },
  { item_code: 'RM-ING-027', name: 'Raspberry syrup', category: 'syrups', unit: 'l', current_stock: 10.0, cost_per_unit: 320.0 },
  { item_code: 'RM-ING-028', name: 'Peach syrup', category: 'syrups', unit: 'l', current_stock: 12.0, cost_per_unit: 340.0 },
  { item_code: 'RM-ING-029', name: 'Passionfruit syrup', category: 'syrups', unit: 'l', current_stock: 10.0, cost_per_unit: 360.0 },
  { item_code: 'RM-ING-030', name: 'Mango syrup', category: 'syrups', unit: 'l', current_stock: 10.0, cost_per_unit: 340.0 },
  { item_code: 'RM-ING-031', name: 'Blue curacao syrup (non-alcoholic)', category: 'syrups', unit: 'l', current_stock: 8.0, cost_per_unit: 380.0 },
  { item_code: 'RM-ING-032', name: 'Coconut syrup', category: 'syrups', unit: 'l', current_stock: 8.0, cost_per_unit: 380.0 },
  { item_code: 'RM-ING-033', name: 'Grenadine', category: 'syrups', unit: 'l', current_stock: 5.0, cost_per_unit: 400.0 },
  { item_code: 'RM-ING-034', name: 'Mint / peppermint syrup', category: 'syrups', unit: 'l', current_stock: 10.0, cost_per_unit: 350.0 },
  { item_code: 'RM-ING-035', name: 'Simple syrup (house-made)', category: 'syrups', unit: 'l', current_stock: 30.0, cost_per_unit: 100.0 },

  // 5. BAKING — DRY GOODS (dry_goods)
  { item_code: 'RM-ING-036', name: 'All-purpose flour', category: 'dry_goods', unit: 'kg', current_stock: 50.0, cost_per_unit: 50.0 },
  { item_code: 'RM-ING-037', name: 'White sugar / caster sugar', category: 'dry_goods', unit: 'kg', current_stock: 60.0, cost_per_unit: 45.0 },
  { item_code: 'RM-ING-038', name: 'Brown sugar', category: 'dry_goods', unit: 'kg', current_stock: 30.0, cost_per_unit: 70.0 },
  { item_code: 'RM-ING-039', name: 'Icing sugar / powdered sugar', category: 'dry_goods', unit: 'kg', current_stock: 20.0, cost_per_unit: 90.0 },
  { item_code: 'RM-ING-040', name: 'Baking powder', category: 'dry_goods', unit: 'kg', current_stock: 5.0, cost_per_unit: 180.0 },
  { item_code: 'RM-ING-041', name: 'Baking soda', category: 'dry_goods', unit: 'kg', current_stock: 5.0, cost_per_unit: 120.0 },
  { item_code: 'RM-ING-042', name: 'Salt', category: 'dry_goods', unit: 'kg', current_stock: 10.0, cost_per_unit: 20.0 },

  // 6. BAKING — WET GOODS (bakery / sauces)
  { item_code: 'RM-ING-043', name: 'Eggs (whole)', category: 'bakery', unit: 'piece', current_stock: 300.0, cost_per_unit: 6.0 },
  { item_code: 'RM-ING-044', name: 'Vanilla extract', category: 'bakery', unit: 'ml', current_stock: 2000.0, cost_per_unit: 2.0 },
  { item_code: 'RM-ING-045', name: 'Rose water', category: 'bakery', unit: 'ml', current_stock: 1000.0, cost_per_unit: 1.5 },
  { item_code: 'RM-ING-046', name: 'Hazelnut spread (e.g. Nutella)', category: 'sauces', unit: 'kg', current_stock: 15.0, cost_per_unit: 600.0 },

  // 7. FRESH PRODUCE (fruits_veg)
  { item_code: 'RM-ING-047', name: 'Limes (fresh)', category: 'fruits_veg', unit: 'piece', current_stock: 150.0, cost_per_unit: 5.0 },
  { item_code: 'RM-ING-048', name: 'Fresh strawberries', category: 'fruits_veg', unit: 'kg', current_stock: 10.0, cost_per_unit: 300.0 },
  { item_code: 'RM-ING-049', name: 'Fresh basil', category: 'fruits_veg', unit: 'g', current_stock: 500.0, cost_per_unit: 0.5 },
  { item_code: 'RM-ING-050', name: 'Fresh mint', category: 'fruits_veg', unit: 'g', current_stock: 1000.0, cost_per_unit: 0.3 },
  { item_code: 'RM-ING-051', name: 'Fresh ginger', category: 'fruits_veg', unit: 'g', current_stock: 500.0, cost_per_unit: 0.4 },

  // 8. DRIED & SPECIALTY (specialty)
  { item_code: 'RM-ING-052', name: 'Dried culinary lavender', category: 'specialty', unit: 'g', current_stock: 250.0, cost_per_unit: 2.5 },
  { item_code: 'RM-ING-053', name: 'Dried rose petals', category: 'specialty', unit: 'g', current_stock: 250.0, cost_per_unit: 2.0 },
  { item_code: 'RM-ING-054', name: 'Vanilla pods', category: 'specialty', unit: 'piece', current_stock: 50.0, cost_per_unit: 150.0 },
  { item_code: 'RM-ING-055', name: 'Cinnamon powder', category: 'specialty', unit: 'g', current_stock: 500.0, cost_per_unit: 0.8 },
  { item_code: 'RM-ING-056', name: 'Sea salt', category: 'specialty', unit: 'g', current_stock: 500.0, cost_per_unit: 0.6 },
  { item_code: 'RM-ING-057', name: 'Cardamom', category: 'specialty', unit: 'g', current_stock: 300.0, cost_per_unit: 1.5 },

  // 9. CAFÉ FOOD ITEMS (other / dairy)
  { item_code: 'RM-ING-058', name: 'Pasta (penne or fettuccine)', category: 'other', unit: 'kg', current_stock: 25.0, cost_per_unit: 150.0 },
  { item_code: 'RM-ING-059', name: 'Garlic cloves (fresh)', category: 'other', unit: 'g', current_stock: 1000.0, cost_per_unit: 0.2 },
  { item_code: 'RM-ING-060', name: 'Parmesan cheese (grated)', category: 'dairy', unit: 'kg', current_stock: 10.0, cost_per_unit: 1200.0 },
  { item_code: 'RM-ING-061', name: 'Sourdough or ciabatta bread', category: 'other', unit: 'piece', current_stock: 40.0, cost_per_unit: 60.0 },
  { item_code: 'RM-ING-062', name: 'Sandwich fillings: chicken, tuna, or vegetables', category: 'other', unit: 'kg', current_stock: 15.0, cost_per_unit: 450.0 },
  { item_code: 'RM-ING-063', name: 'Cheese slices', category: 'dairy', unit: 'piece', current_stock: 200.0, cost_per_unit: 12.0 },
  { item_code: 'RM-ING-064', name: 'Lettuce, tomato, cucumber', category: 'other', unit: 'g', current_stock: 3000.0, cost_per_unit: 0.1 },
  { item_code: 'RM-ING-065', name: 'Mayonnaise / mustard / sauce', category: 'other', unit: 'kg', current_stock: 15.0, cost_per_unit: 200.0 },

  // 10. BAKING — ADD-INS & TOPPINGS (bakery)
  { item_code: 'RM-ING-066', name: 'Chocolate chips (dark)', category: 'bakery', unit: 'kg', current_stock: 10.0, cost_per_unit: 450.0 },
  { item_code: 'RM-ING-067', name: 'White chocolate chips', category: 'bakery', unit: 'kg', current_stock: 10.0, cost_per_unit: 480.0 },
  { item_code: 'RM-ING-068', name: 'Crushed pistachios', category: 'bakery', unit: 'g', current_stock: 500.0, cost_per_unit: 2.0 },
  { item_code: 'RM-ING-069', name: 'Dried lavender buds', category: 'bakery', unit: 'g', current_stock: 200.0, cost_per_unit: 2.5 },
  { item_code: 'RM-ING-070', name: 'Dried rose petals (topping)', category: 'bakery', unit: 'g', current_stock: 200.0, cost_per_unit: 2.0 },
  { item_code: 'RM-ING-071', name: 'Pink food colouring', category: 'bakery', unit: 'ml', current_stock: 100.0, cost_per_unit: 1.0 },
  { item_code: 'RM-ING-072', name: 'Purple food colouring', category: 'bakery', unit: 'ml', current_stock: 100.0, cost_per_unit: 1.0 },

  // 11. BASICS / CONSUMABLES (other)
  { item_code: 'RM-ING-073', name: 'Filtered water', category: 'other', unit: 'l', current_stock: 1000.0, cost_per_unit: 0.0 },
  { item_code: 'RM-ING-074', name: 'Soda water / sparkling water', category: 'other', unit: 'l', current_stock: 150.0, cost_per_unit: 25.0 },
  { item_code: 'RM-ING-075', name: 'Ice cubes', category: 'other', unit: 'kg', current_stock: 100.0, cost_per_unit: 5.0 },

  // ==================== 12. MACHINES & EQUIPMENT ====================
  // (using 'other' category and 'piece' unit)
  { item_code: 'RM-EQP-001', name: 'Espresso machine + portafilter', category: 'other', unit: 'piece', current_stock: 1.0, cost_per_unit: 250000.0 },
  { item_code: 'RM-EQP-002', name: 'Coffee grinder', category: 'other', unit: 'piece', current_stock: 2.0, cost_per_unit: 45000.0 },
  { item_code: 'RM-EQP-003', name: 'Milk steam wand or frother', category: 'other', unit: 'piece', current_stock: 2.0, cost_per_unit: 12000.0 },
  { item_code: 'RM-EQP-004', name: 'Blender', category: 'other', unit: 'piece', current_stock: 2.0, cost_per_unit: 8000.0 },
  { item_code: 'RM-EQP-005', name: 'Cold brew container (jar)', category: 'other', unit: 'piece', current_stock: 4.0, cost_per_unit: 1500.0 },
  { item_code: 'RM-EQP-006', name: 'Phin filter (optional)', category: 'other', unit: 'piece', current_stock: 5.0, cost_per_unit: 450.0 },
  { item_code: 'RM-EQP-007', name: 'Hand shaker / sealed jar', category: 'other', unit: 'piece', current_stock: 3.0, cost_per_unit: 350.0 },
  { item_code: 'RM-EQP-008', name: 'Oven + muffin tray', category: 'other', unit: 'piece', current_stock: 1.0, cost_per_unit: 35000.0 },
  { item_code: 'RM-EQP-009', name: 'Baking tray (flat)', category: 'other', unit: 'piece', current_stock: 3.0, cost_per_unit: 800.0 },
  { item_code: 'RM-EQP-010', name: '8x8 inch baking tin', category: 'other', unit: 'piece', current_stock: 2.0, cost_per_unit: 600.0 },
  { item_code: 'RM-EQP-011', name: 'Heavy-bottomed saucepan', category: 'other', unit: 'piece', current_stock: 2.0, cost_per_unit: 1200.0 },
  { item_code: 'RM-EQP-012', name: 'Piping bag + nozzle', category: 'other', unit: 'piece', current_stock: 20.0, cost_per_unit: 25.0 },
  { item_code: 'RM-EQP-013', name: 'Toothpick / skewer', category: 'other', unit: 'piece', current_stock: 500.0, cost_per_unit: 0.5 },
  { item_code: 'RM-EQP-014', name: 'Parchment / baking paper', category: 'other', unit: 'piece', current_stock: 5.0, cost_per_unit: 150.0 }
];

// List of all 88 Menu Items with Recipes & Ingredients mapping
const menuItemsData = [
  // --- HOT BREWS ---
  {
    name: 'Espresso',
    category: 'espresso',
    price: 120.0,
    description: 'Classic rich double espresso shot with golden crema.',
    prep_time: 3,
    serving_size: 'Double Shot (40ml)',
    instructions: '1. Grind beans to a fine consistency (like table salt). Dose into the portafilter and distribute evenly.\n2. Tamp firmly and evenly with flat, consistent pressure. Wipe the rim clean.\n3. Purge the group head for 2 seconds, then lock in the portafilter and begin extraction.\n4. Extract at 9 bar / 92–94°C for 25–30 seconds. The shot should flow as a thin, steady stream.\n5. Yield: 30–40ml with a golden crema on top. If it runs too fast, grind finer; too slow, grind coarser.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Filtered water', qty: 40, unit: 'ml' }
    ]
  },
  {
    name: 'Vanilla Espresso',
    category: 'espresso',
    price: 140.0,
    description: 'Espresso shot pulled directly over vanilla syrup.',
    prep_time: 3,
    serving_size: 'Single Shot (50ml)',
    instructions: '1. Pre-warm the espresso cup with hot water, then discard.\n2. Add 10ml of vanilla syrup to the bottom of the cup.\n3. Pull the espresso shot directly over the syrup — the heat will naturally blend them.\n4. Stir gently 2–3 times and serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Filtered water', qty: 40, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 10, unit: 'ml' }
    ]
  },
  {
    name: 'Caramel Espresso',
    category: 'espresso',
    price: 140.0,
    description: 'Classic espresso shot combined with premium caramel syrup.',
    prep_time: 3,
    serving_size: 'Single Shot (50ml)',
    instructions: '1. Pre-warm the cup, then add 10ml of caramel syrup to the bottom.\n2. Pull the espresso directly over the syrup and stir well to fully dissolve.\n3. Optionally finish with a small drizzle of caramel sauce on the crema. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Filtered water', qty: 40, unit: 'ml' },
      { name: 'Caramel syrup', qty: 10, unit: 'ml' }
    ]
  },
  {
    name: 'Cappuccino',
    category: 'cappuccino',
    price: 160.0,
    description: 'Perfect 1:1:1 balance of espresso, steamed whole milk, and thick foam.',
    prep_time: 5,
    serving_size: 'Regular (180ml)',
    instructions: '1. Pull a double espresso into a pre-warmed 180ml cup.\n2. Pour ~150ml of cold milk into a steaming pitcher. Aerate for 4–5 seconds near the surface to build foam, then submerge the wand deeper and heat to 62–65°C. The result should be thick, stiff foam — not silky microfoam.\n3. Tap the pitcher on the counter and swirl to settle.\n4. Pour the steamed milk over the espresso, then spoon the thick foam on top to achieve a 1:1:1 espresso:milk:foam ratio.\n5. Dust with cocoa powder through a fine sieve and serve.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 120, unit: 'ml' },
      { name: 'Cocoa powder', qty: 2, unit: 'g' }
    ]
  },
  {
    name: 'Vanilla Cappuccino',
    category: 'cappuccino',
    price: 175.0,
    description: 'Classic cappuccino infused with warm vanilla syrup.',
    prep_time: 5,
    serving_size: 'Regular (180ml)',
    instructions: '1. Pull double espresso and stir in 10ml of vanilla syrup until fully dissolved.\n2. Steam milk to 62–65°C with stiff foam (see Recipe 4 technique).\n3. Pour steamed milk over the espresso, then spoon foam on top.\n4. Dust with cocoa powder and serve.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 120, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 10, unit: 'ml' },
      { name: 'Cocoa powder', qty: 2, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Cappuccino',
    category: 'cappuccino',
    price: 175.0,
    description: 'Cappuccino sweetened with caramel syrup and finished with a rich caramel drizzle.',
    prep_time: 5,
    serving_size: 'Regular (180ml)',
    instructions: '1. Pull double espresso and stir in 10ml of caramel syrup until dissolved.\n2. Steam milk to 62–65°C with stiff foam.\n3. Pour steamed milk over espresso, spoon foam on top.\n4. Finish with a drizzle of caramel sauce over the foam and serve.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 120, unit: 'ml' },
      { name: 'Caramel syrup', qty: 10, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 5, unit: 'ml' }
    ]
  },
  {
    name: 'Latte',
    category: 'latte',
    price: 170.0,
    description: 'Smooth, double shot espresso blended with steamed microfoam whole milk.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Pull a double espresso into a pre-warmed 240ml cup.\n2. Steam ~220ml of cold milk to 62–65°C, aerating briefly (2–3 seconds only) for smooth, velvety microfoam — not thick foam. Tap and swirl until glossy.\n3. Pour the milk from a low height into the espresso. The microfoam will naturally rise, leaving about 1cm of foam on top.\n4. Latte art is optional. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 180, unit: 'ml' }
    ]
  },
  {
    name: 'Vanilla Latte',
    category: 'latte',
    price: 185.0,
    description: 'Espresso and steamed microfoam milk sweetened with vanilla syrup.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add 15ml of vanilla syrup to a pre-warmed 240ml cup.\n2. Pull espresso directly over the syrup and stir to combine.\n3. Steam milk to 62–65°C with silky microfoam and pour over the espresso from a low height. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 180, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 15, unit: 'ml' }
    ]
  },
  {
    name: 'Caramel Latte',
    category: 'latte',
    price: 185.0,
    description: 'Velvety espresso latte with caramel syrup, topped with rich caramel drizzle.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add 15ml of caramel syrup to a pre-warmed cup, pull espresso over it, and stir.\n2. Steam milk to 62–65°C with silky microfoam and pour slowly over the espresso.\n3. Drizzle caramel sauce over the foam in a spiral. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 180, unit: 'ml' },
      { name: 'Caramel syrup', qty: 15, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 5, unit: 'ml' }
    ]
  },
  {
    name: 'Hazelnut Latte',
    category: 'latte',
    price: 185.0,
    description: 'Espresso combined with steamed milk and nutty hazelnut syrup.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add 15ml of hazelnut syrup to the cup, pull espresso over it, and stir well.\n2. Steam milk to 62–65°C with silky microfoam.\n3. Pour steamed milk over the espresso. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 180, unit: 'ml' },
      { name: 'Hazelnut syrup', qty: 15, unit: 'ml' }
    ]
  },
  {
    name: 'Lavender Latte',
    category: 'latte',
    price: 190.0,
    description: 'Premium latte infused with fragrant house lavender syrup.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add 15ml of lavender syrup to the cup, pull espresso over it, and stir.\n2. Steam milk (oat milk works especially well here) to 62–65°C with silky microfoam.\n3. Pour over the espresso. Garnish with a few dried culinary lavender buds (optional).',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 180, unit: 'ml' },
      { name: 'Lavender syrup', qty: 15, unit: 'ml' },
      { name: 'Dried culinary lavender', qty: 1, unit: 'g' }
    ]
  },
  {
    name: 'Rose Latte',
    category: 'latte',
    price: 190.0,
    description: 'A delicate floral espresso latte infused with sweet rose syrup.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add 15ml of rose syrup to the cup, pull espresso over it, and stir gently.\n2. Steam milk to 62–65°C with silky microfoam.\n3. Pour over the espresso. Garnish with a food-safe rose petal (optional).',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 180, unit: 'ml' },
      { name: 'Rose syrup', qty: 15, unit: 'ml' },
      { name: 'Dried rose petals', qty: 1, unit: 'g' }
    ]
  },
  {
    name: 'Mocha',
    category: 'mocha',
    price: 180.0,
    description: 'Espresso and rich chocolate sauce blended with steamed whole milk.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add chocolate sauce to the cup and pull espresso over it. Stir vigorously until fully combined.\n2. Steam 180ml of milk to 62–65°C with light microfoam and pour over the mocha base.\n3. Top with whipped cream and drizzle chocolate sauce over the top. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Chocolate sauce (ready-made)', qty: 20, unit: 'ml' }
    ]
  },
  {
    name: 'White Mocha',
    category: 'mocha',
    price: 190.0,
    description: 'Rich espresso with white chocolate sauce and steamed whole milk, topped with cream.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add white chocolate sauce to the cup, pull espresso over it, and stir well until fully smooth.\n2. Steam milk to 62–65°C with light microfoam and pour over the base.\n3. Top with whipped cream. Garnish with white chocolate shavings or vanilla powder (optional).',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'White chocolate sauce', qty: 20, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Mocha',
    category: 'mocha',
    price: 190.0,
    description: 'Espresso mocha with an infusion of caramel syrup and a luxurious caramel drizzle.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add chocolate sauce and caramel syrup to the cup. Pull espresso over them and stir until smooth.\n2. Steam milk to 62–65°C and pour over the base.\n3. Top with whipped cream and drizzle caramel sauce over the top.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Chocolate sauce (ready-made)', qty: 15, unit: 'ml' },
      { name: 'Caramel syrup', qty: 10, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' }
    ]
  },
  {
    name: 'Hazelnut Mocha',
    category: 'mocha',
    price: 190.0,
    description: 'Nutty espresso mocha with rich chocolate sauce and hazelnut syrup.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add chocolate sauce and hazelnut syrup to the cup. Pull espresso over them and stir well — the combination creates a Nutella-like flavour.\n2. Steam milk to 62–65°C and pour over the base.\n3. Top with whipped cream, a chocolate drizzle, and optional crushed hazelnuts.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Chocolate sauce (ready-made)', qty: 15, unit: 'ml' },
      { name: 'Hazelnut syrup', qty: 10, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' }
    ]
  },
  {
    name: 'Americano',
    category: 'americano',
    price: 130.0,
    description: 'Double espresso shots diluted with premium hot water.',
    prep_time: 4,
    serving_size: 'Regular (200ml)',
    instructions: '1. Pull the double espresso into a 200–250ml cup.\n2. Heat water to 85–90°C (not boiling — boiling scorches the espresso).\n3. Pour the hot water over the espresso shot, not the other way around, to preserve the crema. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Filtered water', qty: 150, unit: 'ml' }
    ]
  },
  {
    name: 'Vanilla Americano',
    category: 'americano',
    price: 145.0,
    description: 'Double shot Americano infused with sweet vanilla syrup.',
    prep_time: 4,
    serving_size: 'Regular (200ml)',
    instructions: '1. Add 10ml of vanilla syrup to the cup. Pull espresso over it and stir.\n2. Pour 120–150ml of hot water (85–90°C) over the espresso. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Filtered water', qty: 150, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 10, unit: 'ml' }
    ]
  },
  {
    name: 'Caramel Americano',
    category: 'americano',
    price: 145.0,
    description: 'Americano sweetened with a premium caramel syrup drizzle.',
    prep_time: 4,
    serving_size: 'Regular (200ml)',
    instructions: '1. Add 10ml of caramel syrup to the cup. Pull espresso over it and stir to dissolve.\n2. Add 120–150ml of hot water (85–90°C), stir gently, and serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Filtered water', qty: 150, unit: 'ml' },
      { name: 'Caramel syrup', qty: 10, unit: 'ml' }
    ]
  },
  {
    name: 'Flat White',
    category: 'flat_white',
    price: 170.0,
    description: 'Short, concentrated double ristretto shot topped with silky, thin steamed milk.',
    prep_time: 5,
    serving_size: 'Regular (160ml)',
    instructions: '1. Pull a ristretto double shot — same coffee dose as espresso but only 60ml total water, extracted in 18–22 seconds. The result is sweeter and more concentrated.\n2. Steam ~150ml of cold milk to 60–62°C, aerating very briefly (1–2 seconds only). The milk should be extremely silky with almost no visible foam — like liquid cream.\n3. Tap and swirl the pitcher well. Pour from a very low height into a 160ml cup, leaving only a very thin (less than 5mm) foam layer on top.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 120, unit: 'ml' }
    ]
  },
  {
    name: 'Vanilla Flat White',
    category: 'flat_white',
    price: 180.0,
    description: 'A classic Flat White infused with premium vanilla syrup.',
    prep_time: 5,
    serving_size: 'Regular (160ml)',
    instructions: '1. Add 8–10ml of vanilla syrup to a pre-warmed 160ml cup.\n2. Pull ristretto double shot over the syrup and stir briefly.\n3. Steam milk to 60–62°C with minimal, silky microfoam and pour from a low height. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 120, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 10, unit: 'ml' }
    ]
  },
  {
    name: 'Toffee Flat White',
    category: 'flat_white',
    price: 185.0,
    description: 'Double ristretto with silky steamed milk and house-made toffee syrup.',
    prep_time: 5,
    serving_size: 'Regular (160ml)',
    instructions: '1. Add 8–10ml of toffee or brown sugar syrup to a pre-warmed flat white cup.\n2. Pull ristretto over the syrup and stir to combine.\n3. Steam milk to 60–62°C with very silky, minimal microfoam and pour from a low height.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 120, unit: 'ml' },
      { name: 'Toffee syrup', qty: 10, unit: 'ml' }
    ]
  },
  {
    name: 'Macchiato',
    category: 'macchiato',
    price: 140.0,
    description: 'Double shot espresso marked with a dollop of thick milk foam.',
    prep_time: 3,
    serving_size: 'Single (60ml)',
    instructions: '1. Pull a single or double espresso into a small pre-warmed demitasse cup.\n2. Steam a small amount of milk (80ml), aerating for longer to create stiff, dry foam that holds its shape.\n3. Spoon 1–2 large dollops of foam directly onto the centre of the espresso — it should sit on top as a distinct mark, not blend in.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 30, unit: 'ml' }
    ]
  },
  {
    name: 'Caramel Macchiato',
    category: 'macchiato',
    price: 185.0,
    description: 'Layered milk and vanilla syrup, marked with espresso and dynamic caramel drizzle.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add 15ml of vanilla syrup to a 240ml glass.\n2. Steam milk to 62–65°C with silky microfoam. Pour the milk into the glass first, holding back the foam.\n3. Pull a double espresso and pour it slowly over the back of a spoon onto the milk — it will float as a distinct top layer.\n4. Drizzle caramel sauce over the espresso in a crosshatch or spiral pattern. Serve without stirring.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 15, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 10, unit: 'ml' }
    ]
  },
  {
    name: 'Hazelnut Macchiato',
    category: 'macchiato',
    price: 185.0,
    description: 'Beautifully layered hazelnut syrup, steamed milk, and a bold espresso shot on top.',
    prep_time: 5,
    serving_size: 'Large (240ml)',
    instructions: '1. Add 15ml of hazelnut syrup to a 240ml glass.\n2. Steam milk to 62–65°C with silky microfoam and pour into the glass.\n3. Pull a double espresso and pour slowly over the back of a spoon to layer it on top.\n4. COLD BREWS',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Hazelnut syrup', qty: 15, unit: 'ml' }
    ]
  },

  // --- COLD BREWS ---
  {
    name: 'Vietnamese Iced Cold Coffee',
    category: 'cold_brew',
    price: 180.0,
    description: 'Strong, bold dark roast coffee dripped over ice and sweetened condensed milk.',
    prep_time: 10,
    serving_size: 'Tall Glass (250ml)',
    instructions: '1. Set a Vietnamese phin filter over a small cup. Add 20g of coarse-ground dark roast coffee. Pour 10ml of hot water to bloom the grounds for 30 seconds, then place the press plate on top.\n2. Slowly pour the remaining 70ml of hot water over the press. Cover and let drip for 4–5 minutes — do not rush.\n3. Add 30ml of condensed milk to a tall glass. Pour the hot brewed coffee over it and stir well.\n4. Fill another glass with ice and pour the coffee-milk mixture over it. Serve with a straw.',
    ingredients: [
      { name: 'Coarse ground dark roast coffee', qty: 20, unit: 'g' },
      { name: 'Sweetened condensed milk', qty: 30, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Vietnamese Iced Coffee (Vanilla Version)',
    category: 'cold_brew',
    price: 190.0,
    description: 'Traditional phin-brewed dark coffee sweetened with dynamic vanilla syrup over ice.',
    prep_time: 10,
    serving_size: 'Tall Glass (250ml)',
    instructions: '1. Brew coffee using the phin filter method (see Recipe 26, Steps 1–2).\n2. Add 20ml of vanilla syrup to a tall glass, pour the brewed coffee over it, and stir.\n3. Fill a glass with ice and pour the coffee over it. Serve with a straw.',
    ingredients: [
      { name: 'Coarse ground dark roast coffee', qty: 20, unit: 'g' },
      { name: 'Vanilla syrup', qty: 20, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Cold Brew Float',
    category: 'cold_brew',
    price: 210.0,
    description: 'Rich, smooth cold brew concentrate poured over ice and topped with premium vanilla ice cream.',
    prep_time: 5,
    serving_size: 'Tall Glass (300ml)',
    instructions: '1. Prepare cold brew in advance: Combine 1 part coarse coffee to 5 parts cold water. Stir, cover, and refrigerate for 12–16 hours. Strain through a fine sieve or paper filter. Store in the fridge for up to 2 weeks. Dilute 1:1 with cold water before serving.\n2. Fill a tall glass with ice. Add simple syrup if desired and pour in 120ml of cold brew.\n3. Gently place 2 scoops of vanilla ice cream on top. Serve immediately with a spoon and straw.',
    ingredients: [
      { name: 'Coarse ground dark roast coffee', qty: 24, unit: 'g' },
      { name: 'Vanilla ice cream', qty: 100, unit: 'g' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Cold Brew Float',
    category: 'cold_brew',
    price: 220.0,
    description: 'Smooth cold brew with rich vanilla ice cream, fanned with an amber caramel sauce.',
    prep_time: 5,
    serving_size: 'Tall Glass (300ml)',
    instructions: '1. Drizzle caramel sauce around the inside walls of a tall glass.\n2. Fill with ice and pour in 120ml of diluted cold brew (see Recipe 28).\n3. Gently add 2 scoops of vanilla ice cream on top and drizzle caramel sauce over them. Serve immediately.',
    ingredients: [
      { name: 'Coarse ground dark roast coffee', qty: 24, unit: 'g' },
      { name: 'Vanilla ice cream', qty: 100, unit: 'g' },
      { name: 'Caramel sauce (thick)', qty: 10, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Chocolate Cold Brew Float',
    category: 'cold_brew',
    price: 220.0,
    description: 'Decadent combination of cold brew and rich chocolate ice cream topped with syrup.',
    prep_time: 5,
    serving_size: 'Tall Glass (300ml)',
    instructions: '1. Swirl chocolate sauce around the inside of a tall glass.\n2. Fill with ice and pour in 120ml of diluted cold brew (see Recipe 28).\n3. Add 2 scoops of chocolate ice cream on top and drizzle chocolate sauce over them. Serve immediately.',
    ingredients: [
      { name: 'Coarse ground dark roast coffee', qty: 24, unit: 'g' },
      { name: 'Chocolate ice cream', qty: 100, unit: 'g' },
      { name: 'Chocolate sauce (ready-made)', qty: 10, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Iced Latte',
    category: 'latte',
    price: 170.0,
    description: 'Espresso poured over chilled whole milk and fresh ice.',
    prep_time: 4,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Pull a double espresso and let it cool for 1–2 minutes.\n2. Fill a tall glass with ice cubes. Pour in 150ml of cold milk.\n3. Slowly pour the cooled espresso over the milk — it will layer on top before blending.\n4. Stir gently and serve.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Vanilla Iced Latte',
    category: 'latte',
    price: 185.0,
    description: 'Chilled iced latte infused with vanilla syrup.',
    prep_time: 4,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Stir 15ml of vanilla syrup into 150ml of cold milk until dissolved.\n2. Fill a tall glass with ice, pour in the vanilla milk, then add the cooled espresso on top. Serve with a straw.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 15, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Iced Latte',
    category: 'latte',
    price: 185.0,
    description: 'Chilled espresso latte with sweet caramel syrup, ice, and caramel drizzle.',
    prep_time: 4,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Stir 15ml of caramel syrup into the cold milk. Drizzle caramel sauce inside the glass before adding ice.\n2. Fill with ice, pour in the caramel milk, then add the cooled espresso on top.\n3. Drizzle caramel sauce over the top and serve.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Caramel syrup', qty: 15, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 5, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Hazelnut Iced Latte',
    category: 'latte',
    price: 185.0,
    description: 'Espresso, cold milk, and hazelnut syrup served refreshing and cold over ice.',
    prep_time: 4,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Stir 15ml of hazelnut syrup into the cold milk. Fill a tall glass with ice.\n2. Pour the hazelnut milk over the ice, then add the cooled espresso on top. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Hazelnut syrup', qty: 15, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Brown Sugar Iced Latte',
    category: 'latte',
    price: 190.0,
    description: 'Chilled espresso latte sweetened with brown sugar syrup and cinnamon dust.',
    prep_time: 4,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Stir 15ml of brown sugar syrup into the cold milk.\n2. Fill a tall glass with ice, pour in the brown sugar milk, then add the cooled espresso on top.\n3. Dust lightly with ground cinnamon and serve.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Brown sugar syrup', qty: 15, unit: 'ml' },
      { name: 'Cinnamon powder', qty: 1, unit: 'g' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Lavender Iced Latte',
    category: 'latte',
    price: 195.0,
    description: 'Chilled microfoam latte with house lavender syrup over ice.',
    prep_time: 4,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Stir 15ml of lavender syrup into the cold milk.\n2. Fill a tall glass with ice, pour in the lavender milk, then slowly pour the cooled espresso over the top.\n3. Optionally garnish with 2–3 dried culinary lavender buds.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Lavender syrup', qty: 15, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Pistachio Iced Latte',
    category: 'latte',
    price: 200.0,
    description: 'Delicious chilled espresso latte fanned with pistachio syrup and crushed nuts.',
    prep_time: 4,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Stir 15ml of pistachio syrup into the cold milk.\n2. Fill a tall glass with ice, pour in the pistachio milk, then add the cooled espresso on top.\n3. Sprinkle crushed pistachios over the surface and serve.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Crushed pistachios', qty: 5, unit: 'g' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Iced Cappuccino',
    category: 'cappuccino',
    price: 175.0,
    description: 'Espresso, cold milk, and shaken stiff cold milk foam on top.',
    prep_time: 5,
    serving_size: 'Chilled Glass (250ml)',
    instructions: '1. Make cold foam: seal 120ml of cold milk in a jar and shake vigorously for 45–60 seconds, or use a handheld cold frother for 30 seconds, until thick and foamy.\n2. Pull espresso and let it cool slightly.\n3. Fill a tall glass with ice. Add 80ml of cold milk, then pour in the espresso.\n4. Spoon cold foam generously on top and serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 160, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Vanilla Iced Cappuccino',
    category: 'cappuccino',
    price: 185.0,
    description: 'Chilled iced cappuccino sweetened with premium vanilla syrup.',
    prep_time: 5,
    serving_size: 'Chilled Glass (250ml)',
    instructions: '1. Make cold foam (see Recipe 38). Pull espresso and stir in 10ml of vanilla syrup. Cool slightly.\n2. Fill glass with ice, pour in cold milk, then the vanilla espresso.\n3. Spoon cold foam generously on top.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 160, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 10, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Iced Cappuccino',
    category: 'cappuccino',
    price: 185.0,
    description: 'Chilled iced cappuccino with sweet caramel syrup, topped with thick cold foam and drizzle.',
    prep_time: 5,
    serving_size: 'Chilled Glass (250ml)',
    instructions: '1. Make cold foam (see Recipe 38). Pull espresso and stir in 10ml of caramel syrup. Cool slightly.\n2. Fill glass with ice, pour in cold milk, then the caramel espresso.\n3. Spoon cold foam on top and finish with a caramel drizzle.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 160, unit: 'ml' },
      { name: 'Caramel syrup', qty: 10, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 5, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Iced Mocha',
    category: 'mocha',
    price: 185.0,
    description: 'Double espresso blended with premium chocolate sauce, milk, ice, and whipped cream.',
    prep_time: 5,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Pull espresso and stir in chocolate sauce until fully dissolved. Cool for 2 minutes.\n2. Fill a tall glass with ice and pour in 150ml of cold milk.\n3. Add the chocolate espresso over the milk. Top with whipped cream and a drizzle of chocolate sauce.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Chocolate sauce (ready-made)', qty: 20, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Hazelnut Iced Mocha (Nutella Style)',
    category: 'mocha',
    price: 195.0,
    description: 'Espresso mocha with chocolate sauce, hazelnut syrup, cold milk, and whipped cream.',
    prep_time: 5,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Stir chocolate sauce and hazelnut syrup into the pulled espresso until smooth. Cool briefly.\n2. Fill a glass with ice, pour in cold milk, then add the hazelnut-chocolate espresso.\n3. Top with whipped cream and a drizzle of chocolate or hazelnut sauce.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Chocolate sauce (ready-made)', qty: 15, unit: 'ml' },
      { name: 'Hazelnut syrup', qty: 10, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Turtle Iced Mocha',
    category: 'mocha',
    price: 200.0,
    description: 'Decadent iced mocha with chocolate, caramel syrup, whipped cream, and caramel drizzle.',
    prep_time: 5,
    serving_size: 'Chilled Glass (300ml)',
    instructions: '1. Stir chocolate sauce and caramel syrup into the pulled espresso until smooth. Cool briefly.\n2. Drizzle caramel inside the glass, fill with ice, pour in cold milk, then add the espresso blend.\n3. Top with whipped cream and a caramel drizzle.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Chocolate sauce (ready-made)', qty: 15, unit: 'ml' },
      { name: 'Caramel syrup', qty: 10, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 5, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Iced Americano',
    category: 'americano',
    price: 130.0,
    description: 'Rich espresso poured over ice and cold filtered water.',
    prep_time: 3,
    serving_size: 'Chilled Glass (250ml)',
    instructions: '1. Fill a tall glass with ice cubes, then pour in 120ml of cold water.\n2. Pull a double espresso and pour it slowly over the water and ice — it will float on top, creating a natural layered effect. Serve without stirring.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Filtered water', qty: 120, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Vanilla Iced Americano',
    category: 'americano',
    price: 145.0,
    description: 'Cold water and double espresso sweetened with premium vanilla syrup over ice.',
    prep_time: 3,
    serving_size: 'Chilled Glass (250ml)',
    instructions: '1. Stir 10ml of vanilla syrup into 120ml of cold water. Fill a tall glass with ice.\n2. Pour the vanilla water over the ice, then slowly pour the espresso on top. Serve immediately.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Filtered water', qty: 120, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 10, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Iced Macchiato',
    category: 'macchiato',
    price: 180.0,
    description: 'Vanilla syrup and cold milk layered with fresh espresso and ice.',
    prep_time: 4,
    serving_size: 'Chilled Glass (240ml)',
    instructions: '1. Add 15ml of vanilla syrup to the bottom of a tall clear glass.\n2. Fill with ice, then pour in 150ml of cold milk.\n3. Pull espresso and pour slowly over the back of a spoon so it layers on top of the milk. Serve without stirring.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 15, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Iced Macchiato',
    category: 'macchiato',
    price: 195.0,
    description: 'Traditional layered iced macchiato topped with a rich crosshatch of thick caramel drizzle.',
    prep_time: 4,
    serving_size: 'Chilled Glass (240ml)',
    instructions: '1. Add 15ml of vanilla syrup to the bottom of a tall clear glass. Fill with ice, pour in cold milk.\n2. Pull espresso and pour over the back of a spoon to layer on top.\n3. Drizzle caramel sauce over the espresso layer. Serve without stirring.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 15, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 10, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Affogato',
    category: 'espresso',
    price: 150.0,
    description: 'Chilled premium vanilla ice cream drowned in a hot double shot of espresso.',
    prep_time: 2,
    serving_size: 'Dessert Dish (120ml)',
    instructions: '1. Pre-chill a small bowl or glass in the freezer for a few minutes.\n2. Scoop 2 portions of vanilla ice cream (or gelato) into the chilled dish.\n3. Pull a fresh, hot espresso shot and pour it immediately over the ice cream. Serve at once with a spoon.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Vanilla ice cream', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Affogato',
    category: 'espresso',
    price: 165.0,
    description: 'Creamy vanilla ice cream drowned in hot espresso fanned with sweet caramel syrup.',
    prep_time: 2,
    serving_size: 'Dessert Dish (120ml)',
    instructions: '1. Pre-chill a serving dish. Scoop in 2 portions of vanilla ice cream.\n2. Pull espresso and stir in 5ml of caramel syrup until dissolved.\n3. Pour the caramel espresso immediately over the ice cream. Optionally add a drizzle of caramel sauce on top.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Vanilla ice cream', qty: 100, unit: 'g' },
      { name: 'Caramel syrup', qty: 5, unit: 'ml' }
    ]
  },
  {
    name: 'Mocha Affogato',
    category: 'espresso',
    price: 165.0,
    description: 'Decadent chocolate ice cream drowned in bold hot espresso and chocolate drizzle.',
    prep_time: 2,
    serving_size: 'Dessert Dish (120ml)',
    instructions: '1. Pre-chill a bowl. Scoop 2 portions of chocolate ice cream into it and drizzle with chocolate sauce.\n2. Pull a hot espresso and pour immediately over the scoops. Serve at once.\n3. FRAPPUCCINO',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Chocolate ice cream', qty: 100, unit: 'g' },
      { name: 'Chocolate sauce (ready-made)', qty: 10, unit: 'ml' }
    ]
  },

  // --- FRAPPUCCINO ---
  {
    name: 'Coffee Frappuccino',
    category: 'frappuccino',
    price: 190.0,
    description: 'Rich coffee and milk blended with ice and topped with whipped cream.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Pull espresso and allow it to cool to room temperature (hot espresso makes frappuccinos watery).\n2. Add cooled espresso, milk, simple syrup, and ice to a blender. Blend on high for 30–45 seconds until completely smooth and thick with no ice chunks.\n3. Pour into a tall cup, top with whipped cream, and serve immediately with a wide straw.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Simple syrup (house-made)', qty: 20, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },
  {
    name: 'Vanilla Frappuccino',
    category: 'frappuccino',
    price: 200.0,
    description: 'Sweet, creamy vanilla frappuccino topped with whipped cream and vanilla drizzle.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Cool the espresso. Blend with milk, vanilla syrup, and ice for 30–45 seconds until smooth and thick.\n2. Pour into a cup, top with whipped cream, and drizzle vanilla syrup on top.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Vanilla syrup', qty: 15, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },
  {
    name: 'Hazelnut Frappuccino',
    category: 'frappuccino',
    price: 200.0,
    description: 'Nutty, rich frappuccino fanned with hazelnut syrup and whipped cream.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Cool the espresso. Blend with milk, hazelnut syrup, and ice for 30–45 seconds until smooth.\n2. Pour into a cup, top with whipped cream, and finish with a hazelnut or chocolate drizzle.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Hazelnut syrup', qty: 15, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },
  {
    name: 'Brown Sugar Frappuccino',
    category: 'frappuccino',
    price: 210.0,
    description: 'Frappuccino blended with sweet brown sugar, milk, ice, and finished with a pinch of cinnamon.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Cool the espresso. Blend with milk, brown sugar syrup, cinnamon, and ice for 30–45 seconds until smooth.\n2. Pour into a cup, top with whipped cream, and dust with ground cinnamon.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Brown sugar syrup', qty: 15, unit: 'ml' },
      { name: 'Cinnamon powder', qty: 1, unit: 'g' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },
  {
    name: 'Toffee Frappuccino',
    category: 'frappuccino',
    price: 210.0,
    description: 'Chilled frappe with rich toffee syrup, frothed cream, and toffee bits drizzle.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Cool the espresso. Blend with milk, toffee syrup, and ice for 30–45 seconds until smooth.\n2. Pour into a cup, top with whipped cream, and drizzle with toffee sauce.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Toffee syrup', qty: 15, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },
  {
    name: 'Mocha Frappuccino',
    category: 'frappuccino',
    price: 200.0,
    description: 'Thick, frosty chocolate and coffee frappe topped with fluffy whipped cream.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Cool the espresso and stir in the chocolate sauce until dissolved. Blend with milk and ice for 30–45 seconds until smooth.\n2. Pour into a cup, top with whipped cream, and drizzle chocolate sauce on top.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Chocolate sauce (ready-made)', qty: 25, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },
  {
    name: 'Dark Caramel Mocha Frappuccino',
    category: 'frappuccino',
    price: 220.0,
    description: 'Double chocolate and rich caramel sauce blended together with espresso and ice.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Drizzle caramel sauce inside the cup walls and refrigerate while you blend.\n2. Cool the espresso. Blend with chocolate sauce, caramel sauce, milk, and ice for 30–45 seconds until smooth.\n3. Pour into the pre-drizzled cup, top with whipped cream, and finish with a caramel drizzle.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Chocolate sauce (ready-made)', qty: 15, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 15, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Frappuccino',
    category: 'frappuccino',
    price: 200.0,
    description: 'Chilled caramel-infused frappe, drizzled dynamically along inside walls.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Drizzle caramel sauce inside the cup walls.\n2. Cool the espresso. Blend with caramel, milk, and ice for 30–45 seconds until smooth.\n3. Pour into the caramel-drizzled cup, top with whipped cream, and add extra caramel drizzle.',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Caramel syrup', qty: 25, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 10, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },
  {
    name: 'Salted Caramel Frappuccino',
    category: 'frappuccino',
    price: 210.0,
    description: 'Premium salted caramel frappe finished with dynamic sea salt grains.',
    prep_time: 5,
    serving_size: 'Frappe Cup (350ml)',
    instructions: '1. Cool the espresso. Blend with caramel syrup, milk, and ice for 30–45 seconds until smooth.\n2. Pour into a cup, top with whipped cream, drizzle caramel over the top, and finish with a pinch of flaky sea salt.\n3. REFRESHING DRINKS',
    ingredients: [
      { name: 'Espresso coffee beans', qty: 18, unit: 'g' },
      { name: 'Whole milk', qty: 150, unit: 'ml' },
      { name: 'Caramel syrup', qty: 25, unit: 'ml' },
      { name: 'Sea salt', qty: 2, unit: 'g' },
      { name: 'Whipped cream', qty: 15, unit: 'g' },
      { name: 'Ice cubes', qty: 120, unit: 'g' }
    ]
  },

  // --- REFRESHING DRINKS ---
  {
    name: 'Pink Lime Soda',
    category: 'soda',
    price: 130.0,
    description: 'Chilled lime juice and sweet grenadine syrup topped with sparkling soda water.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add syrup and fresh lime juice to the bottom of a tall glass — do not stir.\n2. Fill with ice cubes, then slowly pour soda water over the top. Do not stir — let the natural swirling create a gradient from red at the bottom to clear on top.\n3. Garnish with a lime wheel on the rim and a mint sprig. Serve with a straw.',
    ingredients: [
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Grenadine', qty: 20, unit: 'ml' },
      { name: 'Soda water / sparkling water', qty: 200, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Rose Pink Lime Soda',
    category: 'soda',
    price: 140.0,
    description: 'Chilled lime and fragrant rose syrup fanned with dried rose petals.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add rose syrup and lime juice to a tall glass. Fill with ice.\n2. Pour soda water slowly over the ice — do not stir.\n3. Scatter a few dried food-safe rose petals on the surface and add a lime wheel to the rim.',
    ingredients: [
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Rose syrup', qty: 20, unit: 'ml' },
      { name: 'Soda water / sparkling water', qty: 200, unit: 'ml' },
      { name: 'Dried rose petals', qty: 1, unit: 'g' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Raspberry Lime Soda',
    category: 'soda',
    price: 140.0,
    description: 'Refreshing raspberry syrup and fresh lime juice topped with sparkling soda.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add raspberry syrup and lime juice to a tall glass. Fill with ice.\n2. Pour soda water slowly over the ice without stirring.\n3. Garnish with fresh raspberries on a skewer or floating on top and a lime wheel on the rim.',
    ingredients: [
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Raspberry syrup', qty: 20, unit: 'ml' },
      { name: 'Soda water / sparkling water', qty: 200, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Strawberry-Lime-Basil Soda',
    category: 'soda',
    price: 150.0,
    description: 'Muddled fresh strawberries and basil leaves with lime and sparkling soda.',
    prep_time: 5,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Hull and halve the strawberries. Place them in the glass with the basil leaves and simple syrup.\n2. Muddle firmly 8–10 times with a muddler or the back of a spoon — crush the strawberries and bruise the basil to release the oils. Add lime juice.\n3. Fill with ice, then pour soda water slowly over the top. Garnish with a basil sprig and strawberry slice.',
    ingredients: [
      { name: 'Fresh strawberries', qty: 0.05, unit: 'kg' },
      { name: 'Fresh basil', qty: 3, unit: 'g' },
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Simple syrup (house-made)', qty: 15, unit: 'ml' },
      { name: 'Soda water / sparkling water', qty: 180, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Strawberry-Lime-Basil Soda (Syrup Version)',
    category: 'soda',
    price: 140.0,
    description: 'Fast preparation version using strawberry syrup and fresh frothed basil.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add strawberry syrup, basil syrup, and lime juice to the glass and stir briefly. If using fresh basil instead, muddle 3 leaves in the glass first.\n2. Fill with ice and slowly pour soda water over the top. Garnish with a basil leaf.',
    ingredients: [
      { name: 'Strawberry syrup', qty: 25, unit: 'ml' },
      { name: 'Fresh basil', qty: 2, unit: 'g' },
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Soda water / sparkling water', qty: 180, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Ocean Breeze Soda',
    category: 'soda',
    price: 150.0,
    description: 'A blue gradient refresher combining non-alcoholic curacao, coconut, and lime.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add blue curacao syrup, coconut syrup, and lime juice to the bottom of a tall clear glass. Stir to combine.\n2. Fill with ice cubes, then pour soda water very slowly over the ice to create a blue gradient effect.\n3. Garnish with a lime wheel. Serve without stirring — the layers are the presentation.',
    ingredients: [
      { name: 'Blue curacao syrup (non-alcoholic)', qty: 15, unit: 'ml' },
      { name: 'Coconut syrup', qty: 15, unit: 'ml' },
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Soda water / sparkling water', qty: 200, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Tropical Ocean Breeze Soda',
    category: 'soda',
    price: 160.0,
    description: 'Tropical layers of sweet mango, blue curacao, lime, and sparkling soda.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Pour mango syrup to the very bottom of a tall clear glass — it is the densest and forms the yellow base layer.\n2. Add ice and lime juice, then gently pour in the blue curacao.\n3. Pour soda water very slowly over the top to preserve the tropical yellow-to-blue gradient. Serve without stirring.',
    ingredients: [
      { name: 'Mango syrup', qty: 20, unit: 'ml' },
      { name: 'Blue curacao syrup (non-alcoholic)', qty: 15, unit: 'ml' },
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Soda water / sparkling water', qty: 200, unit: 'ml' },
      { name: 'Ice cubes', qty: 100, unit: 'g' }
    ]
  },
  {
    name: 'Peach Dirty Soda',
    category: 'soda',
    price: 160.0,
    description: 'Refreshing peach soda fanned with a heavy floating layer of sweetened heavy cream.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add peach syrup and lime juice to a tall glass and stir. Fill with ice.\n2. Pour soda water gently over the ice.\n3. Hold a large spoon upside down just above the surface and slowly pour the cream over the back of it so it floats on top without sinking. The cream swirling down is the "dirty" effect. Serve immediately with a straw.',
    ingredients: [
      { name: 'Peach syrup', qty: 25, unit: 'ml' },
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Soda water / sparkling water', qty: 150, unit: 'ml' },
      { name: 'Heavy cream / double cream', qty: 30, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Strawberry Dirty Soda',
    category: 'soda',
    price: 160.0,
    description: 'Chilled strawberry lime soda fanned with a heavy floating layer of heavy cream.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add strawberry syrup and lime juice to the glass. Fill with ice and pour soda water gently over the top.\n2. Float 30ml of heavy cream using the back-of-spoon technique (see Recipe 67). Serve immediately.',
    ingredients: [
      { name: 'Strawberry syrup', qty: 25, unit: 'ml' },
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Soda water / sparkling water', qty: 150, unit: 'ml' },
      { name: 'Heavy cream / double cream', qty: 30, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Passionfruit Dirty Soda',
    category: 'soda',
    price: 170.0,
    description: 'A tropical passionfruit soda topped with rich floating coconut cream.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add passionfruit syrup and lime juice to the glass. Fill with ice and top with soda water.\n2. Float 30ml of coconut cream using the back-of-spoon method (see Recipe 67). Coconut cream creates a thicker, more dramatic float. Serve immediately.',
    ingredients: [
      { name: 'Passionfruit syrup', qty: 25, unit: 'ml' },
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Soda water / sparkling water', qty: 150, unit: 'ml' },
      { name: 'Coconut cream', qty: 30, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },
  {
    name: 'Raspberry Dirty Soda',
    category: 'soda',
    price: 160.0,
    description: 'Fruity raspberry lime soda fanned with a floating layer of heavy cream.',
    prep_time: 3,
    serving_size: 'Soda Glass (250ml)',
    instructions: '1. Add raspberry syrup and lime juice to an iced glass. Top with soda water.\n2. Float 30ml of heavy cream using the back-of-spoon technique (see Recipe 67). Serve immediately.\n3. ADD-ONS / EXTRA ITEMS',
    ingredients: [
      { name: 'Raspberry syrup', qty: 25, unit: 'ml' },
      { name: 'Limes (fresh)', qty: 1, unit: 'piece' },
      { name: 'Soda water / sparkling water', qty: 150, unit: 'ml' },
      { name: 'Heavy cream / double cream', qty: 30, unit: 'ml' },
      { name: 'Ice cubes', qty: 80, unit: 'g' }
    ]
  },

  // --- ADD-ONS / EXTRA ITEMS (Grouped as soda for liquid items) ---
  {
    name: 'Hot Chocolate',
    category: 'soda',
    price: 150.0,
    description: 'Decadent milk frothed together with dark cocoa and chopped chocolates.',
    prep_time: 5,
    serving_size: 'Mug (280ml)',
    instructions: '1. Chop the chocolate finely so it melts evenly. Heat 250ml of whole milk in a saucepan over medium-low heat until just simmering (small bubbles at the edges, ~75–80°C) — do not boil.\n2. Remove from heat and whisk in the chopped chocolate and cocoa powder until completely smooth. Add 1–2 tsp of sugar to taste.\n3. Pour into a pre-warmed mug. Top with whipped cream and dust with cocoa powder.',
    ingredients: [
      { name: 'Whole milk', qty: 250, unit: 'ml' },
      { name: 'Dark chocolate (70% cocoa)', qty: 0.04, unit: 'kg' },
      { name: 'Cocoa powder', qty: 6, unit: 'g' },
      { name: 'White sugar / caster sugar', qty: 0.01, unit: 'kg' }
    ]
  },
  {
    name: 'Hazelnut Hot Chocolate',
    category: 'soda',
    price: 165.0,
    description: 'Choco-hazelnut frothed milk topped with whipped cream and drizzle.',
    prep_time: 5,
    serving_size: 'Mug (280ml)',
    instructions: '1. Heat milk to just simmering. Remove from heat and whisk in chopped milk chocolate and cocoa until smooth.\n2. Stir in 15ml of hazelnut syrup. Pour into a pre-warmed mug.\n3. Top with whipped cream and finish with a hazelnut drizzle and optional crushed hazelnuts.',
    ingredients: [
      { name: 'Whole milk', qty: 250, unit: 'ml' },
      { name: 'Milk chocolate', qty: 0.04, unit: 'kg' },
      { name: 'Cocoa powder', qty: 6, unit: 'g' },
      { name: 'Hazelnut syrup', qty: 15, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Hot Chocolate',
    category: 'soda',
    price: 165.0,
    description: 'Rich hot chocolate frothed with caramel syrup and whipped cream.',
    prep_time: 5,
    serving_size: 'Mug (280ml)',
    instructions: '1. Heat milk to just simmering. Whisk in chocolate and cocoa until smooth.\n2. Stir in 15ml of caramel syrup. Pour into a pre-warmed mug.\n3. Top with whipped cream and drizzle caramel sauce on top.',
    ingredients: [
      { name: 'Whole milk', qty: 250, unit: 'ml' },
      { name: 'Milk chocolate', qty: 0.04, unit: 'kg' },
      { name: 'Cocoa powder', qty: 6, unit: 'g' },
      { name: 'Caramel syrup', qty: 15, unit: 'ml' },
      { name: 'Caramel sauce (thick)', qty: 5, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' }
    ]
  },
  {
    name: 'Mint Hot Chocolate',
    category: 'soda',
    price: 165.0,
    description: 'Fragrant peppermint-infused dark frothed chocolate topped with fresh whipped cream.',
    prep_time: 5,
    serving_size: 'Mug (280ml)',
    instructions: '1. Heat milk to just simmering. Whisk in dark chocolate (70%+ works best with mint) and cocoa until smooth.\n2. Stir in 10ml of mint syrup — start with 8ml and taste, as mint can overpower quickly.\n3. Pour into a pre-warmed mug. Top with whipped cream and a fresh mint leaf.\n4. LIGHT BITES',
    ingredients: [
      { name: 'Whole milk', qty: 250, unit: 'ml' },
      { name: 'Dark chocolate (70% cocoa)', qty: 0.04, unit: 'kg' },
      { name: 'Cocoa powder', qty: 6, unit: 'g' },
      { name: 'Mint / peppermint syrup', qty: 10, unit: 'ml' },
      { name: 'Whipped cream', qty: 15, unit: 'g' }
    ]
  },

  // --- LIGHT BITES ---
  {
    name: 'Vanilla Cupcakes',
    category: 'light_bites',
    price: 80.0,
    description: 'Soft and fluffy base vanilla cupcake with premium buttercream icing.',
    prep_time: 35,
    serving_size: '1 Piece',
    instructions: '1. Preheat oven to 175°C. Line a 12-hole muffin tray with paper liners.\n2. Beat softened butter and sugar together with a mixer for 4–5 minutes until pale and fluffy. (Butter must be at room temperature — not melted.)\n3. Add eggs one at a time, mixing well after each. Mix in vanilla extract.\n4. Sift together flour, baking powder, and salt. Add the dry ingredients and milk alternately to the butter mixture in 3 parts (dry–wet–dry), mixing on low. Stop as soon as combined — do not overmix.\n5. Divide batter evenly into the liners, filling each ⅔ full. Bake 18–20 minutes until golden and a toothpick inserted in the centre comes out clean.\n6. Cool completely on a wire rack before frosting with vanilla buttercream.\nSyrup soak tip: Poke holes in baked cupcakes and drizzle 1 tsp of vanilla, lavender, or rose syrup over each while still warm for extra moisture.',
    ingredients: [
      { name: 'All-purpose flour', qty: 0.015, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.0125, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.01, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.16, unit: 'piece' },
      { name: 'Whole milk', qty: 10, unit: 'ml' },
      { name: 'Vanilla extract', qty: 0.5, unit: 'ml' },
      { name: 'Baking powder', qty: 0.5, unit: 'g' }
    ]
  },
  {
    name: 'Rose Cupcakes',
    category: 'light_bites',
    price: 90.0,
    description: 'Delicate floral cupcake infused with rose syrup and pink rose-flavored frosting.',
    prep_time: 35,
    serving_size: '1 Piece',
    instructions: '1. Make the base batter (Recipe 75), replacing vanilla extract with 15ml of rose syrup.\n2. Bake at 175°C for 18–20 minutes. Cool completely.\n3. Beat 100g of softened butter until pale. Gradually add 200g of sifted icing sugar, then 10ml of rose syrup and a few drops of pink food colouring. Beat until light and fluffy. Pipe onto cooled cupcakes in a swirl rosette.\n4. Garnish with a dried food-safe rose petal on each cupcake.',
    ingredients: [
      { name: 'All-purpose flour', qty: 0.015, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.0125, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.01, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.16, unit: 'piece' },
      { name: 'Whole milk', qty: 10, unit: 'ml' },
      { name: 'Rose syrup', qty: 2.5, unit: 'ml' },
      { name: 'Pink food colouring', qty: 0.1, unit: 'ml' }
    ]
  },
  {
    name: 'Lavender Cupcakes',
    category: 'light_bites',
    price: 90.0,
    description: 'A calming cupcake infused with lavender syrup, fanned with purple lavender icing.',
    prep_time: 35,
    serving_size: '1 Piece',
    instructions: '1. Make the base batter (Recipe 75), replacing vanilla with 15ml of lavender syrup.\n2. Bake at 175°C for 18–20 minutes. Cool completely.\n3. Beat 100g of softened butter, add 200g of icing sugar gradually, then 10ml of lavender syrup and a few drops of purple food colouring. Beat until fluffy. Pipe onto cooled cupcakes.\n4. Garnish with 2–3 dried culinary lavender buds on top of each cupcake.',
    ingredients: [
      { name: 'All-purpose flour', qty: 0.015, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.0125, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.01, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.16, unit: 'piece' },
      { name: 'Whole milk', qty: 10, unit: 'ml' },
      { name: 'Lavender syrup', qty: 2.5, unit: 'ml' },
      { name: 'Purple food colouring', qty: 0.1, unit: 'ml' },
      { name: 'Dried lavender buds', qty: 0.5, unit: 'g' }
    ]
  },
  {
    name: 'Chocolate Cupcakes',
    category: 'light_bites',
    price: 85.0,
    description: 'Rich dark chocolate cupcake frosted with velvety chocolate ganache.',
    prep_time: 35,
    serving_size: '1 Piece',
    instructions: '1. Preheat oven to 175°C and line a muffin tray with liners.\n2. Follow the base cupcake method (Recipe 75), but sift the cocoa powder in with the flour. Use a good-quality cocoa powder for a richer flavour.\n3. Fill liners ⅔ full and bake for 18–20 minutes. Cool completely.\n4. Frost with chocolate ganache (heat 120ml cream, pour over 120g chopped dark chocolate, wait 2 minutes, then stir smooth and cool until spreadable) or chocolate buttercream.',
    ingredients: [
      { name: 'All-purpose flour', qty: 0.0125, unit: 'kg' },
      { name: 'Cocoa powder', qty: 3, unit: 'g' },
      { name: 'White sugar / caster sugar', qty: 0.0125, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.01, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.16, unit: 'piece' },
      { name: 'Whole milk', qty: 10, unit: 'ml' }
    ]
  },
  {
    name: 'Chewy Cookies',
    category: 'light_bites',
    price: 70.0,
    description: 'Perfect classic soft and chewy chocolate chip cookie served fresh.',
    prep_time: 30,
    serving_size: '1 Piece',
    instructions: '1. Beat softened butter with both sugars for 3–4 minutes until creamy. Add the whole egg, egg yolk, and vanilla and mix until combined. (The extra yolk adds richness and chewiness.)\n2. Mix in flour, baking soda, and salt on low speed until just combined. Fold in chocolate chips by hand.\n3. Cover and refrigerate the dough for 30 minutes — this prevents spreading and gives a thicker, chewier cookie.\n4. Preheat oven to 165°C. Line baking trays with parchment. Scoop dough into ~50g balls with 5cm spacing.\n5. Bake 11–13 minutes until edges are set and golden but the centres still look slightly soft. They will firm up as they cool. Rest on the tray for 5 minutes before transferring.',
    ingredients: [
      { name: 'All-purpose flour', qty: 0.013, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.01, unit: 'kg' },
      { name: 'Brown sugar', qty: 0.006, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.003, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.1, unit: 'piece' },
      { name: 'Chocolate chips (dark)', qty: 0.01, unit: 'kg' }
    ]
  },
  {
    name: 'Espresso Coffee Cookies',
    category: 'light_bites',
    price: 75.0,
    description: 'Soft chewy cookie infused with instant espresso powder and white chocolate chips.',
    prep_time: 30,
    serving_size: '1 Piece',
    instructions: '1. Make the base cookie dough (Recipe 79, omitting chocolate chips). Add 1.5 tsp of instant espresso powder when creaming the butter and sugar — it dissolves into the fat and flavours the whole dough.\n2. Fold in 100g of white chocolate chips. The sweetness of the white chocolate balances the bitter espresso.\n3. Chill, scoop, and bake exactly as per Recipe 79.',
    ingredients: [
      { name: 'All-purpose flour', qty: 0.013, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.01, unit: 'kg' },
      { name: 'Brown sugar', qty: 0.006, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.003, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.1, unit: 'piece' },
      { name: 'Instant espresso powder', qty: 0.4, unit: 'g' },
      { name: 'White chocolate chips', qty: 0.006, unit: 'kg' }
    ]
  },
  {
    name: 'Hazelnut Swirl Cookies',
    category: 'light_bites',
    price: 80.0,
    description: 'Warm chewy cookies fanned with elegant swirls of hazelnut spread.',
    prep_time: 30,
    serving_size: '1 Piece',
    instructions: '1. Make and chill the base cookie dough (Recipe 79, omitting chips).\n2. Drop 8–10 teaspoon-sized blobs of hazelnut spread across the dough. Fold 2–3 times only — you want visible swirls, not a fully blended dough.\n3. Scoop and bake as per Recipe 79. The hazelnut will create gooey pockets inside the baked cookies.',
    ingredients: [
      { name: 'All-purpose flour', qty: 0.013, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.01, unit: 'kg' },
      { name: 'Brown sugar', qty: 0.006, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.003, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.1, unit: 'piece' },
      { name: 'Hazelnut spread (e.g. Nutella)', qty: 0.005, unit: 'kg' }
    ]
  },
  {
    name: 'Fudgy Brownies',
    category: 'light_bites',
    price: 90.0,
    description: 'Decadent, rich dark chocolate fudgy brownie served warm.',
    prep_time: 40,
    serving_size: '1 Slice',
    instructions: '1. Preheat oven to 175°C. Line an 8×8 inch tin with parchment paper.\n2. Melt chocolate and butter together (double boiler or microwave in 30-second bursts), stirring until smooth. Cool for 5 minutes.\n3. Whisk in sugar until combined. Add eggs one at a time, whisking well after each — this builds the crinkly top. Stir in vanilla.\n4. Fold in sifted flour, cocoa powder, and salt with a spatula until just combined. Do not overmix.\n5. Pour into the tin and bake for 22–25 minutes. The edges should be set but the centre should still look slightly wobbly — it will firm up as it cools. A toothpick should come out with moist crumbs, not wet batter.\n6. Cool completely in the tin (at least 1 hour) before cutting for clean, fudgy squares.',
    ingredients: [
      { name: 'Dark chocolate (70% cocoa)', qty: 0.011, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.007, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.0125, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.18, unit: 'piece' },
      { name: 'All-purpose flour', qty: 0.005, unit: 'kg' },
      { name: 'Cocoa powder', qty: 2, unit: 'g' }
    ]
  },
  {
    name: 'Caramel Swirl Brownies',
    category: 'light_bites',
    price: 100.0,
    description: 'Fudgy chocolate brownie swirled beautifully with sweet caramel sauce.',
    prep_time: 40,
    serving_size: '1 Slice',
    instructions: '1. Make the full brownie batter (Recipe 82) and pour into the lined tin.\n2. Drop 3 tablespoons of caramel sauce across the surface. Use a toothpick to swirl it through the batter in a figure-8 pattern — 4–5 swirls only.\n3. Bake at 175°C for 22–25 minutes. Cool completely before cutting.',
    ingredients: [
      { name: 'Dark chocolate (70% cocoa)', qty: 0.011, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.007, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.0125, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.18, unit: 'piece' },
      { name: 'All-purpose flour', qty: 0.005, unit: 'kg' },
      { name: 'Cocoa powder', qty: 2, unit: 'g' },
      { name: 'Caramel sauce (thick)', qty: 5, unit: 'ml' }
    ]
  },
  {
    name: 'Hazelnut Drizzle Brownies',
    category: 'light_bites',
    price: 105.0,
    description: 'Chilled fudgy brownie drizzled with warm, rich hazelnut spread.',
    prep_time: 40,
    serving_size: '1 Slice',
    instructions: '1. Bake the base brownies (Recipe 82) and cool completely in the tin.\n2. Warm 3 tbsp of hazelnut spread in the microwave in 10-second bursts until just pourable.\n3. Drizzle over the cooled brownie slab in zigzag lines. Allow to set for 10 minutes before cutting into squares.',
    ingredients: [
      { name: 'Dark chocolate (70% cocoa)', qty: 0.011, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.007, unit: 'kg' },
      { name: 'White sugar / caster sugar', qty: 0.0125, unit: 'kg' },
      { name: 'Eggs (whole)', qty: 0.18, unit: 'piece' },
      { name: 'All-purpose flour', qty: 0.005, unit: 'kg' },
      { name: 'Cocoa powder', qty: 2, unit: 'g' },
      { name: 'Hazelnut spread (e.g. Nutella)', qty: 0.005, unit: 'kg' }
    ]
  },
  {
    name: 'Creamy Café Pasta',
    category: 'light_bites',
    price: 240.0,
    description: 'Perfect penne pasta tossed in a rich, buttery garlic cream and parmesan sauce.',
    prep_time: 20,
    serving_size: 'Regular (350g)',
    instructions: '1. Cook pasta in well-salted boiling water until al dente. Reserve ½ cup of pasta water before draining.\n2. In a wide pan, melt butter over medium heat and sauté minced garlic for 60 seconds until fragrant — do not let it brown. Add cream and simmer for 3 minutes until slightly thickened.\n3. Toss drained pasta into the sauce. Add parmesan and stir until every piece is coated. Add splashes of pasta water to loosen if needed.\n4. Season with black pepper and salt to taste. Serve immediately in warm bowls with fresh herbs.',
    ingredients: [
      { name: 'Pasta (penne or fettuccine)', qty: 0.1, unit: 'kg' },
      { name: 'Heavy cream / double cream', qty: 75, unit: 'ml' },
      { name: 'Garlic cloves (fresh)', qty: 10, unit: 'g' },
      { name: 'Unsalted butter', qty: 0.01, unit: 'kg' },
      { name: 'Parmesan cheese (grated)', qty: 0.025, unit: 'kg' }
    ]
  },
  {
    name: 'Classic Café Sandwich',
    category: 'light_bites',
    price: 180.0,
    description: 'Lightly toasted sourdough bread filled with chicken, cheese, and crunchy fresh greens.',
    prep_time: 5,
    serving_size: '1 Piece',
    instructions: '1. Lightly toast both bread slices until golden and firm at the edges. Spread sauce on both slices right to the edges — this creates a moisture barrier and prevents sogginess.\n2. Layer cheese on one slice, then add the filling, followed by the cold vegetables. Season with salt and pepper.\n3. Close the sandwich, press gently, and cut diagonally with a sharp serrated knife.\n4. Serve immediately on a plate with chips and a pickle.\n5. SYRUPS (HOUSE-MADE)',
    ingredients: [
      { name: 'Sourdough or ciabatta bread', qty: 2, unit: 'piece' },
      { name: 'Sandwich fillings: chicken, tuna, or vegetables', qty: 0.08, unit: 'kg' },
      { name: 'Cheese slices', qty: 1, unit: 'piece' },
      { name: 'Lettuce, tomato, cucumber', qty: 40, unit: 'g' },
      { name: 'Mayonnaise / mustard / sauce', qty: 0.015, unit: 'kg' }
    ]
  },

  // --- HOUSE-MADE SYRUPS ---
  {
    name: 'House Simple Syrup',
    category: 'light_bites',
    price: 50.0,
    description: 'Sweetener base used across all beverages and cocktail mixes.',
    prep_time: 10,
    serving_size: 'Bottle (300ml)',
    instructions: '1. Combine sugar and water in a saucepan. Heat on medium, stirring continuously, until the sugar is fully dissolved and the syrup is clear. Do not let it boil.\n2. Remove from heat. Cool to room temperature, then transfer to a sterilised sealed glass bottle. Refrigerate for up to 4 weeks.\nFlavour variations — add during heating, strain before bottling:\nVanilla syrup: 1 split vanilla pod or 2 tsp vanilla extract.\nLavender syrup: 2 tbsp dried culinary lavender — steep off heat for 10 minutes, then strain.\nRose syrup: 2 tbsp dried food-safe rose petals + 2 drops rose water — steep 10 min, strain.\nCaramel syrup: Cook sugar alone until amber, then carefully add hot water and stir smooth.\nHazelnut syrup: 2 tbsp hazelnut paste + ½ tsp vanilla — heat and strain well through cheesecloth.\nBrown sugar syrup: Replace white sugar with brown sugar + a pinch of cinnamon.\nMint syrup: Make base syrup, remove from heat, steep 10 fresh mint leaves for 15 min, then strain.\nGinger syrup: Add 6 slices of fresh ginger during heating, steep 10 min, then strain.',
    ingredients: [
      { name: 'White sugar / caster sugar', qty: 0.2, unit: 'kg' },
      { name: 'Filtered water', qty: 240, unit: 'ml' }
    ]
  },
  {
    name: 'Homemade Caramel Sauce',
    category: 'light_bites',
    price: 70.0,
    description: 'Thick, buttery homemade caramel drizzle for beverages and pastry toppings.',
    prep_time: 15,
    serving_size: 'Jar (250ml)',
    instructions: '1. Heat 200g of sugar in a heavy-bottomed pan over medium heat. Swirl the pan gently (do not stir) until the sugar fully melts into a deep amber caramel. Watch carefully — it can burn quickly once it starts to colour.\n2. Remove briefly from heat and add the cubed butter all at once — it will bubble vigorously. Whisk constantly until fully melted and smooth.\n3. Slowly pour in the warm cream while whisking continuously. Return to low heat briefly if needed and whisk until glossy and smooth.\n4. Add a pinch of salt. Cool for 10 minutes before pouring into a clean glass jar. Refrigerate for up to 3 weeks. Reheat gently before using.',
    ingredients: [
      { name: 'White sugar / caster sugar', qty: 0.2, unit: 'kg' },
      { name: 'Unsalted butter', qty: 0.09, unit: 'kg' },
      { name: 'Heavy cream / double cream', qty: 120, unit: 'ml' },
      { name: 'Salt', qty: 0.002, unit: 'kg' }
    ]
  }
];

async function seedAll() {
  console.log("🌱 Executing Café Master Database Seeding...");

  try {
    // 1. Get dynamic active workspace
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('id, workspace_name')
      .limit(1);

    if (wsError) throw wsError;

    if (!workspaces || workspaces.length === 0) {
      console.error("❌ No workspaces found in database. Please register a workspace first.");
      process.exit(1);
    }

    const workspaceId = workspaces[0].id;
    console.log(`📌 Seeding for Workspace: "${workspaces[0].workspace_name}" (${workspaceId})`);

    // 2. Add workspace_id to raw_materials data and upsert
    console.log(`\n📦 Seeding ${rawMaterialsData.length} Raw Materials (Ingredients & Machines)...`);
    const finalRawMaterials = rawMaterialsData.map(rm => ({
      ...rm,
      workspace_id: workspaceId
    }));

    const { data: insertedRMs, error: rmError } = await supabase
      .from('raw_materials')
      .upsert(finalRawMaterials, { onConflict: 'item_code' })
      .select();

    if (rmError) throw rmError;
    console.log(`✅ Upserted ${insertedRMs.length} raw materials successfully.`);

    // Map raw materials by name for quick ID lookup
    const rmMap = {};
    insertedRMs.forEach(rm => {
      rmMap[rm.name.toLowerCase()] = rm.id;
    });

    // 3. Upsert Menu Items
    console.log(`\n☕ Seeding ${menuItemsData.length} Menu Items...`);
    const finalMenuItems = menuItemsData.map((item, idx) => ({
      item_code: `MENU-CAF-${String(idx + 1).padStart(3, '0')}`,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      gst_percent: item.category === 'soda' || item.category === 'light_bites' ? 12.0 : 5.0,
      is_available: true,
      workspace_id: workspaceId
    }));

    const { data: insertedMenus, error: menuError } = await supabase
      .from('menu_items')
      .upsert(finalMenuItems, { onConflict: 'item_code' })
      .select();

    if (menuError) throw menuError;
    console.log(`✅ Upserted ${insertedMenus.length} menu items successfully.`);

    // 4. Create Recipes and Recipe Ingredients Mapping
    console.log("\n🧪 Connecting Recipes and Recipe Ingredients mappings...");
    for (const menuRecord of insertedMenus) {
      const originalItemData = menuItemsData.find(m => m.name.toLowerCase() === menuRecord.name.toLowerCase());
      if (!originalItemData) continue;

      // 4a. Check if recipe already exists for this menu item
      const { data: existingRecipes, error: searchError } = await supabase
        .from('recipes')
        .select('id')
        .eq('menu_item_id', menuRecord.id)
        .limit(1);

      if (searchError) throw searchError;

      let recipeId;
      const recipePayload = {
        menu_item_id: menuRecord.id,
        serving_size: originalItemData.serving_size,
        prep_time_minutes: originalItemData.prep_time,
        instructions: originalItemData.instructions,
        workspace_id: workspaceId
      };

      if (existingRecipes && existingRecipes.length > 0) {
        recipeId = existingRecipes[0].id;
        const { error: recipeUpError } = await supabase
          .from('recipes')
          .update(recipePayload)
          .eq('id', recipeId);

        if (recipeUpError) throw recipeUpError;
      } else {
        const { data: newRecipe, error: recipeInsError } = await supabase
          .from('recipes')
          .insert(recipePayload)
          .select();

        if (recipeInsError) throw recipeInsError;
        recipeId = newRecipe[0].id;
      }

      // 4b. Clear existing recipe ingredients to prevent duplicates
      const { error: delError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      if (delError) throw delError;

      // 4c. Insert new ingredients mappings
      const ingredientPayloads = originalItemData.ingredients.map(ing => {
        const rawMaterialId = rmMap[ing.name.toLowerCase()];
        if (!rawMaterialId) {
          console.warn(`⚠️ Warning: Raw Material "${ing.name}" not found in ID map!`);
          return null;
        }
        return {
          recipe_id: recipeId,
          raw_material_id: rawMaterialId,
          quantity: ing.qty,
          unit: ing.unit
        };
      }).filter(Boolean);

      if (ingredientPayloads.length > 0) {
        const { error: insIngError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientPayloads);

        if (insIngError) throw insIngError;
      }

      console.log(`   ✨ Connected Recipe & Ingredients for: "${menuRecord.name}"`);
    }

    console.log("\n🎉 Café Master Database Seed Completed Successfully!");

  } catch (err) {
    console.error("\n❌ Seeding failed with error: ", err.message);
    process.exit(1);
  }
}

seedAll();
