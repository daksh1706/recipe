import { supabase } from '../config/supabase.js';

export const getMenuItems = async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*, recipes:recipes(*, recipe_ingredients:recipe_ingredients(*, raw_material:raw_materials(*)))')
      .order('name');

    if (error) throw error;

    // Map output to match frontend camelCase compatibility
    const formattedItems = items.map(item => {
      const recipeObj = item.recipes && item.recipes.length > 0 ? item.recipes[0] : null;
      return {
        _id: item.id,
        id: item.id,
        itemCode: item.item_code,
        name: item.name,
        description: item.description,
        category: item.category,
        price: Number(item.price),
        gstPercent: Number(item.gst_percent),
        isAvailable: item.is_available,
        imageUrl: item.image_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        recipe: recipeObj ? {
          id: recipeObj.id,
          servingSize: recipeObj.serving_size,
          prepTimeMinutes: recipeObj.prep_time_minutes,
          instructions: recipeObj.instructions,
          ingredients: recipeObj.recipe_ingredients ? recipeObj.recipe_ingredients.map(ri => ({
            id: ri.id,
            quantity: Number(ri.quantity),
            unit: ri.unit,
            rawMaterial: ri.raw_material ? {
              id: ri.raw_material.id,
              _id: ri.raw_material.id,
              itemCode: ri.raw_material.item_code,
              name: ri.raw_material.name,
              unit: ri.raw_material.unit,
              currentStock: Number(ri.raw_material.current_stock),
              costPerUnit: Number(ri.raw_material.cost_per_unit)
            } : null
          })) : []
        } : null
      };
    });

    res.json(formattedItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMenuItem = async (req, res) => {
  const { itemCode, item_code, name, description, category, price, gstPercent, gst_percent, isAvailable, is_available, imageUrl, image_url, recipe } = req.body;
  
  const finalCode = itemCode || item_code || `MENU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const finalGst = gstPercent !== undefined ? gstPercent : (gst_percent !== undefined ? gst_percent : 5.0);
  const finalAvailable = isAvailable !== undefined ? isAvailable : (is_available !== undefined ? is_available : true);
  const finalImage = imageUrl || image_url || '';

  try {
    const { data: item, error } = await supabase
      .from('menu_items')
      .insert({
        item_code: finalCode,
        name,
        description: description || '',
        category,
        price: Number(price),
        gst_percent: Number(finalGst),
        is_available: finalAvailable,
        image_url: finalImage
      })
      .select()
      .single();

    if (error) throw error;

    // If recipe is provided, save it
    let insertedRecipe = null;
    if (recipe) {
      const { data: newRecipe, error: recErr } = await supabase
        .from('recipes')
        .insert({
          menu_item_id: item.id,
          serving_size: recipe.servingSize || recipe.serving_size || 'Regular',
          prep_time_minutes: Number(recipe.prepTimeMinutes || recipe.prep_time_minutes || 5),
          instructions: recipe.instructions || ''
        })
        .select()
        .single();

      if (recErr) throw recErr;

      insertedRecipe = newRecipe;

      const ingredients = recipe.ingredients || [];
      if (ingredients.length > 0) {
        const ingredientsInserts = ingredients.map(ing => ({
          recipe_id: newRecipe.id,
          raw_material_id: ing.rawMaterialId || ing.raw_material_id || (ing.rawMaterial ? (ing.rawMaterial.id || ing.rawMaterial._id) : null),
          quantity: Number(ing.quantity),
          unit: ing.unit
        })).filter(i => i.raw_material_id !== null);

        if (ingredientsInserts.length > 0) {
          const { error: ingErr } = await supabase.from('recipe_ingredients').insert(ingredientsInserts);
          if (ingErr) throw ingErr;
        }
      }
    }

    const responseItem = {
      ...item,
      _id: item.id,
      itemCode: item.item_code,
      imageUrl: item.image_url,
      gstPercent: item.gst_percent,
      isAvailable: item.is_available
    };

    if (req.io) {
      req.io.emit('menu_updated', { type: 'add', item: responseItem });
    }

    res.status(201).json(responseItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { itemCode, item_code, name, description, category, price, gstPercent, gst_percent, isAvailable, is_available, imageUrl, image_url, recipe } = req.body;
  
  const updates = {};
  if (itemCode !== undefined) updates.item_code = itemCode;
  else if (item_code !== undefined) updates.item_code = item_code;

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (price !== undefined) updates.price = Number(price);
  
  if (gstPercent !== undefined) updates.gst_percent = Number(gstPercent);
  else if (gst_percent !== undefined) updates.gst_percent = Number(gst_percent);

  if (isAvailable !== undefined) updates.is_available = isAvailable;
  else if (is_available !== undefined) updates.is_available = is_available;

  if (imageUrl !== undefined) updates.image_url = imageUrl;
  else if (image_url !== undefined) updates.image_url = image_url;

  updates.updated_at = new Date().toISOString();

  try {
    const { data: item, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update recipe if provided
    if (recipe) {
      // Check if recipe exists
      const { data: existingRecipe } = await supabase
        .from('recipes')
        .select('id')
        .eq('menu_item_id', id)
        .maybeSingle();

      let recipeId;
      if (existingRecipe) {
        recipeId = existingRecipe.id;
        await supabase
          .from('recipes')
          .update({
            serving_size: recipe.servingSize || recipe.serving_size || 'Regular',
            prep_time_minutes: Number(recipe.prepTimeMinutes || recipe.prep_time_minutes || 5),
            instructions: recipe.instructions || ''
          })
          .eq('id', recipeId);
      } else {
        const { data: newRecipe } = await supabase
          .from('recipes')
          .insert({
            menu_item_id: id,
            serving_size: recipe.servingSize || recipe.serving_size || 'Regular',
            prep_time_minutes: Number(recipe.prepTimeMinutes || recipe.prep_time_minutes || 5),
            instructions: recipe.instructions || ''
          })
          .select()
          .single();
        recipeId = newRecipe?.id;
      }

      if (recipeId) {
        // Clear old ingredients and insert new ones
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
        
        const ingredients = recipe.ingredients || [];
        if (ingredients.length > 0) {
          const ingredientsInserts = ingredients.map(ing => ({
            recipe_id: recipeId,
            raw_material_id: ing.rawMaterialId || ing.raw_material_id || (ing.rawMaterial ? (ing.rawMaterial.id || ing.rawMaterial._id) : null),
            quantity: Number(ing.quantity),
            unit: ing.unit
          })).filter(i => i.raw_material_id !== null);

          if (ingredientsInserts.length > 0) {
            const { error: ingErr } = await supabase.from('recipe_ingredients').insert(ingredientsInserts);
            if (ingErr) throw ingErr;
          }
        }
      }
    }

    const responseItem = {
      ...item,
      _id: item.id,
      itemCode: item.item_code,
      imageUrl: item.image_url,
      gstPercent: item.gst_percent,
      isAvailable: item.is_available
    };

    if (req.io) {
      req.io.emit('menu_updated', { type: 'update', item: responseItem });
    }

    res.json(responseItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: item, error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (item) {
      if (req.io) req.io.emit('menu_updated', { type: 'delete', id });
      res.json({ message: 'Menu item removed' });
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
