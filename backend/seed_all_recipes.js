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
    instructions: '1. Grind espresso beans fine. Tamp firmly and evenly in portafilter.\n2. Extract at 9 bar pressure, 92-94°C for 25-30 seconds.\n3. Yield: 30-40ml with golden crema.',
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
    instructions: '1. Add vanilla syrup to the cup first.\n2. Pull espresso shot directly over the syrup.\n3. Stir gently and serve.',
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
    instructions: '1. Add caramel syrup to the cup.\n2. Pull espresso shot over the syrup. Stir and serve.',
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
    instructions: '1. Pull double espresso into a 180ml cup.\n2. Steam whole milk to 65°C; keep foam stiff (1:1:1 ratio).\n3. Pour steamed milk, spoon foam on top, dust with cocoa powder.',
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
    instructions: '1. Stir vanilla syrup into the pulled espresso.\n2. Steam whole milk, pour over, spoon foam on top.\n3. Dust with cocoa powder.',
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
    instructions: '1. Stir caramel syrup into espresso.\n2. Pour steamed milk and foam. Drizzle caramel sauce on top.',
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
    instructions: '1. Pull double shot espresso into a 240ml cup.\n2. Steam whole milk silky smooth (microfoam), pour from low height.\n3. Leave 1cm foam on top.',
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
    instructions: '1. Add vanilla syrup to cup. Pull espresso over it.\n2. Pour silky steamed whole milk and serve.',
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
    instructions: '1. Add caramel syrup to cup with espresso.\n2. Pour steamed milk. Drizzle caramel sauce over the foam.',
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
    instructions: '1. Stir hazelnut syrup into espresso.\n2. Pour steamed milk. Serve immediately.',
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
    instructions: '1. Add lavender syrup to cup. Pull espresso over it.\n2. Pour steamed microfoam whole milk. Garnish with dried lavender buds.',
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
    instructions: '1. Add rose syrup to cup. Pull espresso over it.\n2. Pour steamed milk. Garnish with rose petals.',
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
    instructions: '1. Mix chocolate sauce and espresso at the bottom of cup until combined.\n2. Steam whole milk and pour over. Top with whipped cream and chocolate drizzle.',
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
    instructions: '1. Mix white chocolate sauce and espresso.\n2. Add steamed milk. Top with whipped cream.',
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
    instructions: '1. Mix chocolate sauce + caramel syrup + espresso.\n2. Pour steamed milk. Top with whipped cream and caramel drizzle.',
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
    instructions: '1. Combine chocolate sauce + hazelnut syrup + espresso.\n2. Add steamed milk. Top with whipped cream.',
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
    instructions: '1. Pull double espresso shot first into cup.\n2. Add hot water (not boiling) over the shot. Serve immediately.',
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
    instructions: '1. Add vanilla syrup to cup. Pull espresso over it.\n2. Top with hot water and serve.',
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
    instructions: '1. Add caramel syrup to cup with espresso. Add hot water. Stir and serve.',
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
    instructions: '1. Pull a ristretto shot (30ml x 2, short and concentrated).\n2. Steam whole milk very silky with minimal foam.\n3. Pour into a 160ml cup. Coffee-forward ratio.',
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
    instructions: '1. Add vanilla syrup to cup. Pour ristretto over it.\n2. Add silky steamed whole milk and serve.',
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
    instructions: '1. Stir toffee syrup into the ristretto.\n2. Add steamed milk and serve immediately.',
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
    instructions: '1. Pull espresso into a small cup.\n2. Spoon a dollop of stiff whole milk foam on top.',
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
    instructions: '1. Add vanilla syrup to cup. Pour steamed milk over.\n2. Slowly pour espresso on top - it will layer.\n3. Drizzle caramel sauce over the top.',
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
    instructions: '1. Add hazelnut syrup to cup. Pour milk.\n2. Pour espresso over the back of a spoon to create layers.',
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
    instructions: '1. Brew coffee using a phin filter (or strong espresso). Let drip for 4-5 min.\n2. Place condensed milk in glass. Pour hot coffee over and stir well.\n3. Pour over a tall glass of ice.',
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
    instructions: '1. Brew coffee as above.\n2. Add vanilla syrup to glass, pour coffee over, then pour over ice.',
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
    instructions: '1. Make cold brew in advance and refrigerate.\n2. Fill glass with ice. Pour cold brew.\n3. Add vanilla ice cream scoops on top.',
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
    instructions: '1. Fill glass with ice. Pour cold brew.\n2. Place ice cream on top.\n3. Drizzle caramel sauce over scoops.',
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
    instructions: '1. Fill glass with ice. Pour cold brew.\n2. Top with chocolate ice cream and drizzle chocolate sauce.',
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
    instructions: '1. Pull espresso. Let cool slightly.\n2. Fill tall glass with ice, add whole milk first, then pour espresso over.',
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
    instructions: '1. Stir vanilla syrup into cold milk.\n2. Fill glass with ice, pour milk, then espresso on top.',
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
    instructions: '1. Add caramel syrup to milk, stir.\n2. Pour over ice and espresso. Drizzle caramel on top.',
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
    instructions: '1. Mix hazelnut syrup into milk. Pour over ice and espresso.',
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
    instructions: '1. Stir brown sugar syrup into milk.\n2. Pour over ice, add espresso. Dust with cinnamon.',
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
    instructions: '1. Stir lavender syrup into milk. Pour over ice and espresso.',
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
    instructions: '1. Mix pistachio syrup into milk. Pour over ice and espresso.\n2. Garnish with crushed pistachios on top.',
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
    instructions: '1. Shake cold milk in a sealed jar or cold frother to make cold foam.\n2. Add ice to glass, pour espresso and milk.\n3. Spoon cold foam generously on top.',
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
    instructions: '1. Add vanilla syrup to espresso. Pour over iced milk.\n2. Top with cold foam.',
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
    instructions: '1. Add caramel syrup to espresso. Pour over iced milk.\n2. Top with cold foam and caramel drizzle.',
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
    instructions: '1. Mix chocolate sauce + espresso until smooth.\n2. Add ice to glass, pour milk, then chocolate-coffee mixture.\n3. Top with whipped cream and chocolate drizzle.',
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
    instructions: '1. Mix chocolate sauce + hazelnut syrup + espresso.\n2. Pour over iced milk. Top with whipped cream.',
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
    instructions: '1. Mix chocolate + caramel + espresso.\n2. Pour over iced milk. Top with whipped cream and caramel drizzle.',
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
    instructions: '1. Fill glass with ice and cold water first.\n2. Pour espresso over the top - creates a natural layered effect.',
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
    instructions: '1. Add vanilla syrup to water. Fill glass with ice.\n2. Pour espresso on top.',
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
    instructions: '1. Add vanilla syrup to the bottom of glass.\n2. Add ice, then pour cold milk.\n3. Slowly pour espresso over the back of a spoon - it will layer on top.',
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
    instructions: '1. Add vanilla syrup to glass. Add ice and milk.\n2. Pour espresso slowly over back of spoon.\n3. Drizzle caramel sauce over the top.',
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
    instructions: '1. Scoop vanilla ice cream into a small bowl or glass.\n2. Pull hot espresso shot and pour immediately over the ice cream.',
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
    instructions: '1. Add caramel syrup to espresso. Pull shot.\n2. Pour immediately over ice cream scoops.',
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
    instructions: '1. Scoop chocolate ice cream into bowl.\n2. Pour hot espresso over. Drizzle chocolate sauce. Serve immediately.',
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
    instructions: '1. Add all ingredients except whipped cream to a blender.\n2. Blend on high for 30 seconds until smooth and thick.\n3. Pour into cup. Top with whipped cream.',
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
    instructions: '1. Blend all ingredients until smooth.\n2. Top with whipped cream and a drizzle of vanilla syrup.',
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
    instructions: '1. Blend all ingredients until smooth.\n2. Pour into cup. Top with whipped cream and hazelnut drizzle.',
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
    instructions: '1. Blend espresso, milk, syrup, cinnamon, and ice until smooth.\n2. Top with whipped cream and a cinnamon dusting.',
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
    instructions: '1. Blend all until smooth. Top with whipped cream and toffee drizzle.',
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
    instructions: '1. Blend espresso, chocolate sauce, milk, and ice until smooth.\n2. Pour into cup. Top with whipped cream and chocolate drizzle.',
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
    instructions: '1. Blend all liquid ingredients with ice until smooth.\n2. Top with whipped cream and drizzle caramel inside the cup before pouring.',
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
    instructions: '1. Drizzle caramel inside the cup walls. Blend espresso, milk, caramel syrup, and ice.\n2. Pour, top with whipped cream and extra caramel drizzle.',
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
    instructions: '1. Blend espresso, caramel, milk, ice until smooth.\n2. Top with whipped cream. Sprinkle sea salt on whip and drizzle caramel.',
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
    instructions: '1. Add syrup and lime juice to the bottom of glass.\n2. Fill with ice, top with soda water. Do not stir - let it swirl naturally.\n3. Garnish with lime wheel.',
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
    instructions: '1. Add rose syrup and lime juice to glass.\n2. Add ice. Top with soda water. Garnish with rose petals.',
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
    instructions: '1. Add raspberry syrup and lime juice to glass.\n2. Add ice. Top with soda water. Garnish with raspberries.',
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
    instructions: '1. Muddle strawberries and basil with simple syrup in the glass.\n2. Add lime juice and ice.\n3. Top with soda water. Garnish with a basil leaf.',
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
    instructions: '1. Add syrups and lime juice to glass. Add ice.\n2. Top with soda water. Garnish with basil leaf.',
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
    instructions: '1. Mix blue curacao + coconut syrup + lime juice at the bottom of glass.\n2. Add ice. Pour soda water slowly for a gradient ocean effect. Garnish with lime.',
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
    instructions: '1. Pour mango syrup to glass bottom first.\n2. Add ice and lime juice. Add blue curacao.\n3. Top slowly with soda water - the layers create an ocean gradient.',
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
    instructions: '1. Add peach syrup and lime juice to iced glass.\n2. Pour soda water.\n3. Slowly pour cream over the back of a spoon to float on top - the cream swirling down is the "dirty" effect.',
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
    instructions: '1. Add strawberry syrup + lime juice to iced glass.\n2. Top with soda water, then float cream over the back of a spoon.',
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
    instructions: '1. Add passionfruit syrup + lime juice to iced glass.\n2. Pour soda water. Float coconut cream over the top.',
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
    instructions: '1. Add raspberry syrup + lime juice to iced glass.\n2. Pour soda water. Float cream over back of spoon.',
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
    instructions: '1. Heat milk until just simmering. Do not boil.\n2. Whisk in chopped chocolate and cocoa powder until fully smooth.\n3. Pour into mug. Top with whipped cream.',
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
    instructions: '1. Heat milk. Whisk in chocolate and cocoa.\n2. Stir in hazelnut syrup. Top with whipped cream.',
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
    instructions: '1. Heat milk. Whisk in chocolate and cocoa.\n2. Stir in caramel syrup. Top with whipped cream and caramel drizzle.',
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
    instructions: '1. Heat milk. Whisk in chocolate and cocoa.\n2. Stir in mint syrup. Top with whipped cream.',
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
    instructions: '1. Preheat oven to 175°C. Cream butter and sugar.\n2. Beat in eggs one at a time. Add vanilla.\n3. Fold in flour, baking powder, salt alternately with milk.\n4. Bake 18-20 min. Frost when cooled.',
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
    instructions: '1. Make base batter, replacing vanilla extract with rose syrup.\n2. Bake as per base recipe.\n3. Beat buttercream ingredients with rose syrup and pink colouring, pipe onto cooled cupcakes.',
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
    instructions: '1. Make base batter with lavender syrup instead of vanilla.\n2. Bake as per base recipe.\n3. Pipe lavender buttercream on cooled cupcakes. Garnish with lavender buds.',
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
    instructions: '1. Follow base cupcake method, replacing a portion of flour with cocoa powder.\n2. Frost with chocolate ganache or chocolate buttercream.',
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
    instructions: '1. Cream butter and sugars. Mix in eggs and vanilla.\n2. Fold in flour, baking soda, and salt. Stir in chocolate chips.\n3. Chill 30 min, scoop, and bake at 165°C for 11-13 min.',
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
    instructions: '1. Mix espresso powder into butter-sugar mixture.\n2. Fold in flour, baking soda, salt, and white chocolate chips.\n3. Chill, bake, and cool as per base recipe.',
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
    instructions: '1. Make cookie dough as per base recipe.\n2. Drop teaspoon-sized blobs of hazelnut spread into dough. Fold 2-3 times only.\n3. Scoop and bake.',
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
    instructions: '1. Melt chocolate and butter together. Cool slightly.\n2. Whisk in sugar, add eggs one by one. Add vanilla.\n3. Fold in flour, cocoa, and salt. Bake at 175°C for 22-25 min.\n4. Cool in tin before cutting.',
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
    instructions: '1. Make base brownie batter and pour into lined tin.\n2. Drop spoonfuls of caramel sauce onto the batter, swirl with toothpick.\n3. Bake as per base recipe.',
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
    instructions: '1. Bake base brownies as per recipe.\n2. Warm hazelnut spread and drizzle generously over cooled brownies before cutting.',
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
    instructions: '1. Boil pasta al dente. Reserve pasta water.\n2. Sauté minced garlic in butter. Add heavy cream and simmer 3 min.\n3. Toss drained pasta into sauce with grated parmesan and black pepper.',
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
    instructions: '1. Toast bread lightly. Spread sauce on both slices.\n2. Layer cheese, filling, and fresh vegetables.\n3. Cut diagonally and serve warm.',
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
    instructions: '1. Combine sugar and water in a saucepan.\n2. Heat on medium, stirring until sugar fully dissolves. Do not boil.\n3. Cool and bottle.',
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
    instructions: '1. Melt sugar in pan on medium heat, swirling until amber.\n2. Carefully add butter, whisk until melted.\n3. Slowly pour in warm cream, whisking constantly. Whisk in a pinch of salt.',
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
