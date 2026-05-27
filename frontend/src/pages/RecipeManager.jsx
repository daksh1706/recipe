import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  Coffee, Edit, Plus, Trash2, Clock, CheckCircle, Eye, ArrowLeft, BookOpen, AlertTriangle
} from 'lucide-react';

const RecipeManager = () => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // State
  const [menuItems, setMenuItems] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedItem, setSelectedItem] = useState(null); // active item detailed review
  const [isEditing, setIsEditing] = useState(false); // form edit mode toggle

  // Form State
  const [servingSize, setServingSize] = useState('Regular');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(5);
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState([]); // Array of { rawMaterialId, quantity, unit }

  const units = ['ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup'];

  const fetchData = async () => {
    try {
      // 1. Fetch Menu Items with Recipes
      const menuRes = await fetch('/api/menu', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const menuData = await menuRes.json();
      if (menuRes.ok) {
        setMenuItems(menuData);
        // If an item was selected, sync its fresh state
        if (selectedItem) {
          const fresh = menuData.find(m => m._id === selectedItem._id);
          if (fresh) setSelectedItem(fresh);
        }
      }

      // 2. Fetch Raw Materials for Autocomplete
      const matRes = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const matData = await matRes.json();
      if (matRes.ok) setRawMaterials(matData);

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Enter edit mode
  const handleEditClick = (item) => {
    const r = item.recipe || {};
    setServingSize(r.servingSize || 'Regular');
    setPrepTimeMinutes(r.prepTimeMinutes || 5);
    setInstructions(r.instructions || '');
    
    // Map current ingredients
    if (r.ingredients && r.ingredients.length > 0) {
      setIngredients(r.ingredients.map(ing => ({
        rawMaterialId: ing.rawMaterial ? ing.rawMaterial.id : '',
        quantity: ing.quantity,
        unit: ing.unit
      })));
    } else {
      setIngredients([{ rawMaterialId: '', quantity: 1, unit: 'g' }]);
    }
    
    setIsEditing(true);
  };

  // Add a dynamic ingredient row
  const addIngredientRow = () => {
    setIngredients(prev => [...prev, { rawMaterialId: '', quantity: 1, unit: 'g' }]);
  };

  // Remove a dynamic ingredient row
  const removeIngredientRow = (idx) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle dynamic ingredient change
  const handleIngredientChange = (idx, field, value) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  // Save recipe
  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    
    // Validate ingredients
    const cleanIngredients = ingredients.filter(i => i.rawMaterialId !== '');
    if (cleanIngredients.length === 0) {
      showToast('Please add at least one ingredient to the recipe', 'warning');
      return;
    }

    const payload = {
      recipe: {
        servingSize,
        prepTimeMinutes: Number(prepTimeMinutes),
        instructions,
        ingredients: cleanIngredients
      }
    };

    try {
      const res = await fetch(`/api/menu/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Recipe saved successfully!', 'success');
        setIsEditing(false);
        fetchData();
      } else {
        showToast(data.message || 'Failed to save recipe', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          <div className="glass skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
          <div className="glass skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Panel */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Recipe Studio</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
          Formulate preparations, adjust portion sizes, and link safety stocks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem' }} className="mobile-stack">
        
        {/* Left Side: Product Selector List */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: '65vh', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--primary)" /> Product List
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="custom-scroll">
            {menuItems.map(item => (
              <div 
                key={item._id} 
                onClick={() => { setSelectedItem(item); setIsEditing(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: `1px solid ${selectedItem?._id === item._id ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: selectedItem?._id === item._id ? 'rgba(140, 98, 57, 0.05)' : 'var(--bg-dark)',
                  transition: 'var(--transition)'
                }}
                className="hover-brighten"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Coffee size={18} color="var(--text-subtle)" />
                  )}
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Category: {item.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.recipe ? (
                    <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(92,184,92,0.15)', color: '#5cb85c', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}>Active</span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(217,83,79,0.15)', color: '#d9534f', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}>No Recipe</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Selected Recipe detail viewer / Edit form */}
        <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', minHeight: '65vh', overflowY: 'auto' }}>
          
          {!selectedItem ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)', textAlign: 'center' }}>
              <Coffee size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3>No Product Selected</h3>
              <p style={{ maxWidth: '300px', margin: '0 auto', fontSize: '0.85rem' }}>Please select a menu item on the left panel to build or audit its ingredient recipe.</p>
            </div>
          ) : isEditing ? (
            
            // Dynamic Form: Add/Edit recipe
            <form onSubmit={handleSaveRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Edit Recipe: {selectedItem.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code: {selectedItem.itemCode}</span>
                </div>
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ height: '2.2rem', padding: '0 0.85rem', fontSize: '0.8rem' }}>
                  <ArrowLeft size={14} /> Back
                </button>
              </div>

              {/* Serving and Prep time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Portion serving size</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Regular 250ml / 1 piece"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Prep time (Minutes)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Dynamic ingredient rows */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>Recipe Ingredients Map</label>
                  <button type="button" onClick={addIngredientRow} className="btn btn-secondary" style={{ height: '1.8rem', padding: '0 0.5rem', fontSize: '0.75rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                    <Plus size={12} /> Add Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {ingredients.map((ing, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      
                      {/* Autocomplete raw material lookup */}
                      <select
                        value={ing.rawMaterialId}
                        required
                        onChange={(e) => handleIngredientChange(idx, 'rawMaterialId', e.target.value)}
                        style={{ flex: 2, height: '2.5rem', padding: '0 0.75rem', fontSize: '0.85rem' }}
                      >
                        <option value="">-- Choose Raw Material --</option>
                        {rawMaterials.map(mat => (
                          <option key={mat._id} value={mat._id}>{mat.name} ({mat.unit})</option>
                        ))}
                      </select>

                      {/* Quantity input */}
                      <input 
                        type="number" 
                        step="any"
                        min="0.001"
                        required
                        placeholder="Qty"
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(idx, 'quantity', Number(e.target.value))}
                        style={{ flex: 0.8, height: '2.5rem', padding: '0 0.5rem', fontSize: '0.85rem' }}
                      />

                      {/* Unit matching */}
                      <select
                        value={ing.unit}
                        required
                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                        style={{ flex: 1, height: '2.5rem', padding: '0 0.5rem', fontSize: '0.85rem' }}
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>

                      {/* Delete row */}
                      <button 
                        type="button" 
                        onClick={() => removeIngredientRow(idx)}
                        style={{ border: 'none', background: 'transparent', color: '#d9534f', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions steps */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Preparation Instructions</label>
                <textarea 
                  rows="4"
                  placeholder="Step 1. Grind 18g espresso beans...&#10;Step 2. Texture milk..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  style={{ borderRadius: 'var(--radius-md)', padding: '0.85rem' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', height: '2.75rem', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <CheckCircle size={18} /> Save Recipe Formulas
              </button>

            </form>
          ) : (
            
            // Detail Viewer: Review current recipe
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {selectedItem.imageUrl ? (
                    <img src={selectedItem.imageUrl} alt={selectedItem.name} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}><Coffee size={28} /></div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedItem.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Category: {selectedItem.category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </div>
                </div>

                <button onClick={() => handleEditClick(selectedItem)} className="btn btn-primary" style={{ height: '2.4rem', padding: '0 1rem', fontSize: '0.85rem' }}>
                  <Edit size={16} /> Edit Recipe
                </button>
              </div>

              {selectedItem.recipe ? (
                <>
                  {/* Preparation Specs info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', backgroundColor: 'var(--bg-dark)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block' }}>PORTION SERVING SIZE</span>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{selectedItem.recipe.servingSize}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={20} color="var(--primary)" />
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block' }}>PREPARATION TIME</span>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{selectedItem.recipe.prepTimeMinutes} Minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients Table */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Recipe Ingredients</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Material</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Standard Qty</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Unit</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Current Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.recipe.ingredients.map((ing, idx) => {
                          const raw = ing.rawMaterial || {};
                          const isLow = Number(raw.currentStock || 0) <= Number(raw.minimumStockLevel || 10);
                          return (
                            <tr key={idx}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700' }}>{raw.name || 'Unknown'}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{ing.quantity}</td>
                              <td style={{ padding: '0.75rem 0.5rem', textTransform: 'lowercase' }}>{ing.unit}</td>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: isLow ? '#d9534f' : 'var(--text-main)' }}>
                                {(() => {
                                  if (raw.currentStock === undefined) return 'N/A';
                                  const stock = Number(raw.currentStock);
                                  const unit = raw.unit || '';
                                  if (stock >= 1000 && (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gm' || unit.toLowerCase() === 'ml')) {
                                    return `${(stock / 1000).toFixed(1)} ${unit.toLowerCase() === 'ml' ? 'L' : 'kg'}`;
                                  }
                                  return `${raw.currentStock} ${raw.unit}`;
                                })()}
                                {isLow && <span style={{ fontSize: '0.65rem', marginLeft: '0.5rem', backgroundColor: 'rgba(217,83,79,0.15)', color: '#d9534f', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Low</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Preparation Instructions</h4>
                    <div style={{ 
                      whiteSpace: 'pre-wrap', 
                      background: 'var(--border-light)', 
                      padding: '1.25rem', 
                      borderRadius: 'var(--radius-md)', 
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: 'var(--text-main)',
                      borderLeft: '4px solid var(--primary)'
                    }}>
                      {selectedItem.recipe.instructions || 'No instructions provided.'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={36} color="#d9534f" style={{ marginBottom: '1rem' }} />
                  <p style={{ fontWeight: '800' }}>No Recipe Formulated Yet</p>
                  <p style={{ fontSize: '0.8rem', maxWidth: '300px', textAlign: 'center', marginTop: '0.25rem' }}>Ingredients are not automatically deducted on purchase for this product until a recipe is configured.</p>
                  <button onClick={() => handleEditClick(selectedItem)} className="btn btn-primary" style={{ height: '2.2rem', padding: '0 1rem', fontSize: '0.8rem', marginTop: '1.5rem' }}>
                    <Plus size={14} /> Build Recipe Formula
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default RecipeManager;
