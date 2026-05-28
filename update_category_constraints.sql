-- Drop the existing constraint if it exists
ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS raw_materials_category_check;

-- Recreate the constraint with our new, granular beverage categories included
ALTER TABLE raw_materials ADD CONSTRAINT raw_materials_category_check CHECK (
  category IN (
    'coffee_beans', 
    'milk_dairy', 
    'syrups_sauces', 
    'bakery', 
    'fruits', 
    'packaging', 
    'cleaning', 
    'other', 
    'chocolate_cocoa', 
    'fruits_veg', 
    'specialty', 
    'dry_goods', 
    'milk', 
    'dairy', 
    'syrups', 
    'sauces'
  )
);
