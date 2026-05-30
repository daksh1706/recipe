import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../App';
import { 
  Plus, Edit, Trash2, X, Upload, Coffee, Search, Grid, List, CheckCircle, HelpCircle, Eye, EyeOff
} from 'lucide-react';

const generatePrefix = (categoryStr) => {
  if (!categoryStr) return 'XX';
  const clean = categoryStr.replace(/_/g, ' ').replace(/[^a-zA-Z\s]/g, '').trim();
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return words.map(w => w[0].toUpperCase()).join('');
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return 'XX';
};

const generateNextCode = (cat, itemsList) => {
  const prefix = generatePrefix(cat);
  const regex = new RegExp(`^${prefix}-(\\d{3,})$`);
  let maxNum = 0;
  
  if (itemsList && Array.isArray(itemsList)) {
    itemsList.forEach(item => {
      if (item.category === cat) {
        const code = item.itemCode || item.item_code || '';
        const match = code.toUpperCase().match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
  }
  
  const nextNum = maxNum + 1;
  const formattedNum = nextNum.toString().padStart(3, '0');
  return `${prefix}-${formattedNum}`;
};

const getNutrition = (itemName = '') => {
  const name = itemName.toLowerCase();
  let calories = 120;
  let carbs = 15;
  let protein = 2;
  let fat = 3;

  if (name.includes('espresso')) {
    calories = 5;
    carbs = 0.5;
    protein = 0.3;
    fat = 0.1;
  } else if (name.includes('americano')) {
    calories = 10;
    carbs = 1;
    protein = 0.5;
    fat = 0.1;
  } else if (name.includes('latte') || name.includes('flat white')) {
    calories = 120;
    carbs = 12;
    protein = 7;
    fat = 5;
  } else if (name.includes('cappuccino')) {
    calories = 100;
    carbs = 10;
    protein = 6;
    fat = 4;
  } else if (name.includes('mocha')) {
    calories = 230;
    carbs = 28;
    protein = 8;
    fat = 9;
  } else if (name.includes('frappuccino') || name.includes('shake')) {
    calories = 310;
    carbs = 42;
    protein = 9;
    fat = 11;
  } else if (name.includes('soda')) {
    calories = 140;
    carbs = 35;
    protein = 0;
    fat = 0;
  } else if (name.includes('cupcake') || name.includes('cookie') || name.includes('brownie')) {
    calories = 280;
    carbs = 38;
    protein = 4;
    fat = 12;
  } else if (name.includes('pasta')) {
    calories = 420;
    carbs = 54;
    protein = 14;
    fat = 16;
  } else if (name.includes('sandwich')) {
    calories = 350;
    carbs = 32;
    protein = 15;
    fat = 14;
  }

  if (name.includes('caramel') || name.includes('vanilla') || name.includes('hazelnut') || name.includes('toffee')) {
    calories += 50;
    carbs += 12;
  }

  return { calories, carbs, protein, fat };
};

const MenuManager = () => {
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // Menu States
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const [selectedDish, setSelectedDish] = useState(null);

  // Form Fields
  const [itemCode, setItemCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('espresso');
  const [price, setPrice] = useState('');
  const [gstPercent, setGstPercent] = useState(5.0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'espresso', label: 'Espresso' },
    { value: 'latte', label: 'Latte' },
    { value: 'cappuccino', label: 'Cappuccino' },
    { value: 'mocha', label: 'Mocha' },
    { value: 'americano', label: 'Americano' },
    { value: 'flat_white', label: 'Flat White' },
    { value: 'macchiato', label: 'Macchiato' },
    { value: 'frappuccino', label: 'Frappuccino' },
    { value: 'cold_brew', label: 'Cold Brews' },
    { value: 'soda', label: 'Sodas & Cold Drinks' },
    { value: 'light_bites', label: 'Light Bites' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'sandwich', label: 'Sandwich' },
    { value: 'hot_chocolate', label: 'Hot Chocolate' }
  ];

  // Auto-generate code on Category Change
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const nextCode = generateNextCode(newCat, menuItems);
    setItemCode(nextCode);
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu');
      if (!res.ok) throw new Error('Failed to load menu');
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Delete flow
  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: 'Delete Menu Product',
      message: 'Are you sure you want to delete this menu product? This will purge recipe associations!',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Deletion failed');
          setMenuItems(prev => prev.filter(m => m._id !== id));
          showToast('Menu product successfully deleted!');
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Availability toggle
  const toggleAvailability = async (item) => {
    const updatedStatus = !item.isAvailable;
    setMenuItems(prev => prev.map(m => m._id === item._id ? { ...m, isAvailable: updatedStatus } : m));
    try {
      const res = await fetch(`/api/menu/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: updatedStatus })
      });
      if (!res.ok) {
        setMenuItems(prev => prev.map(m => m._id === item._id ? { ...m, isAvailable: !updatedStatus } : m));
        const err = await res.json();
        showToast(err.message || 'Status toggle failed', 'error');
      }
    } catch (err) {
      setMenuItems(prev => prev.map(m => m._id === item._id ? { ...m, isAvailable: !updatedStatus } : m));
      showToast(err.message, 'error');
    }
  };

  // Open Form Modal
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setItemCode(item.itemCode || item.item_code || '');
      setName(item.name);
      setDescription(item.description || '');
      setCategory(item.category);
      setPrice(item.price);
      setGstPercent(item.gstPercent || 5.0);
      setIsAvailable(item.isAvailable);
      setImageUrl(item.imageUrl || '');
      
      const defaultNut = getNutrition(item.name);
      setCalories(item.calories !== undefined && item.calories !== null ? item.calories : defaultNut.calories);
      setCarbs(item.carbs !== undefined && item.carbs !== null ? item.carbs : defaultNut.carbs);
      setProtein(item.protein !== undefined && item.protein !== null ? item.protein : defaultNut.protein);
      setFat(item.fat !== undefined && item.fat !== null ? item.fat : defaultNut.fat);
    } else {
      setEditItem(null);
      setName('');
      setDescription('');
      setCategory('espresso');
      const nextCode = generateNextCode('espresso', menuItems);
      setItemCode(nextCode);
      setPrice('');
      setGstPercent(5.0);
      setIsAvailable(true);
      setImageUrl('');
      setCalories('');
      setCarbs('');
      setProtein('');
      setFat('');
    }
    setShowModal(true);
  };

  // Save Menu Item CRUD flow
  const handleSaveItem = async (e) => {
    e.preventDefault();

    const payload = {
      itemCode,
      name,
      description,
      category,
      price: Number(price),
      gstPercent: Number(gstPercent),
      isAvailable,
      imageUrl,
      calories: calories !== '' ? Number(calories) : null,
      carbs: carbs !== '' ? Number(carbs) : null,
      protein: protein !== '' ? Number(protein) : null,
      fat: fat !== '' ? Number(fat) : null
    };

    const url = editItem ? `/api/menu/${editItem._id}` : '/api/menu';
    const method = editItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(`${name} saved successfully!`, 'success');
        setShowModal(false);
        fetchMenuItems();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to save product', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete product
  const handleDeleteItem = (id, name) => {
    setConfirmModal({
      show: true,
      title: 'Delete Menu Item',
      message: `Are you sure you want to delete ${name} from the active menu? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/menu/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          if (res.ok) {
            showToast(`${name} deleted from menu`, 'success');
            fetchMenuItems();
          } else {
            const data = await res.json();
            showToast(data.message || 'Deletion failed', 'error');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // View recipe redirect
  const handleViewRecipe = (item) => {
    if (item && item._id) {
      navigate(`/recipes?item_id=${item._id}`, { state: { selectedItemId: item._id } });
    } else {
      navigate('/recipes');
    }
  };

  // Local image uploading mock base64 reader
  const handleImageRead = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter items locally by search and category tabs
  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' ? true : item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header with Search and Layout toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Menu Items</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Manage pricing structures, tax thresholds, stock availability, and ingredients formulas.</span>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ height: '2.5rem', padding: '0 1.25rem' }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Categories Tabs Pill Bar and layout toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        
        {/* Category Tab pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }} className="custom-scroll">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '30px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                transition: 'var(--transition)',
                backgroundColor: selectedCategory === cat.value ? 'var(--primary)' : 'var(--bg-panel)',
                color: selectedCategory === cat.value ? 'white' : 'var(--text-muted)'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search bar & Grid/List switches */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.25rem', height: '2.2rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('card')} style={{ height: '2.2rem', width: '2.2rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'card' ? 'var(--primary)' : 'transparent', color: viewMode === 'card' ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
              <Grid size={16} />
            </button>
            <button onClick={() => setViewMode('table')} style={{ height: '2.2rem', width: '2.2rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'table' ? 'var(--primary)' : 'transparent', color: viewMode === 'table' ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
              <List size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* MAIN BODY: Grid vs Table lists */}
      {filteredMenu.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-muted)' }}>
          <Coffee size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
          <p>No coffee or bites found matching filter filters.</p>
        </div>
      ) : viewMode === 'card' ? (
        
        // VIEW MODE: CARD GRID
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {filteredMenu.map(item => (
            <div 
              key={item._id} 
              className="glass hover-brighten" 
              onClick={() => setSelectedDish(item)}
              style={{ 
                borderRadius: 'var(--radius-lg)', 
                padding: '1.25rem', 
                display: 'flex', 
                flexDirection: 'column',
                opacity: item.isAvailable ? 1 : 0.6,
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              {/* Product Image */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDish(item);
                }}
                style={{ width: '100%', height: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--border-light)', marginBottom: '1rem', position: 'relative', cursor: 'zoom-in' }}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)' }}><Coffee size={36} /></div>
                )}
                
                {/* Active availability indicator */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAvailability(item);
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: item.isAvailable ? 'var(--primary)' : '#d9534f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                  title="Toggle stock status"
                >
                  {item.isAvailable ? <Eye size={10} /> : <EyeOff size={10} />}
                  {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>

              {/* Title & Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDish(item);
                    }}
                    style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', cursor: 'pointer' }}
                    title="Click to view details"
                  >
                    {item.name} 🔍
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', fontWeight: '700' }}>{item.itemCode}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, height: '2.5rem', overflow: 'hidden' }}>{item.description || 'No description provided.'}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>PRICE</span>
                    <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>₹{Number(item.price).toFixed(1)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>GST RATE</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.85rem' }}>{item.gstPercent}% Tax</span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleViewRecipe(item)} className="btn btn-secondary" style={{ height: '2rem', padding: 0, fontSize: '0.75rem', fontWeight: '800' }}>
                  View Recipe
                </button>
                <button onClick={() => handleOpenModal(item)} className="btn btn-secondary" style={{ height: '2rem', padding: 0, color: 'var(--primary)' }} title="Edit"><Edit size={14} /></button>
                <button onClick={() => handleDeleteItem(item._id, item.name)} className="btn btn-secondary" style={{ height: '2rem', padding: 0, color: '#d9534f' }} title="Delete"><Trash2 size={14} /></button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        
        // VIEW MODE: TABLE LIST
        <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem 0.5rem' }}>Code</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Price (₹)</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>GST Tax</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Active Stock</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenu.map(item => (
                <tr 
                  key={item._id} 
                  className="hover-brighten" 
                  onClick={() => setSelectedDish(item)}
                  style={{ opacity: item.isAvailable ? 1 : 0.6, cursor: 'pointer' }}
                >
                  <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-subtle)', fontSize: '0.75rem', fontWeight: '700' }}>{item.itemCode}</td>
                  <td 
                    style={{ padding: '0.85rem 0.5rem', fontWeight: '800', fontSize: '0.85rem', color: 'var(--primary)' }}
                    title="Click to view specifications & ingredients"
                  >
                    {item.name} 🔍
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>{item.category.replace('_', ' ')}</td>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: '800', color: 'var(--primary)' }}>₹{Number(item.price).toFixed(1)}</td>
                  <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', fontWeight: '600' }}>{item.gstPercent}%</td>
                  
                  {/* Availability check toggle */}
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAvailability(item);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        color: item.isAvailable ? '#5cb85c' : '#d9534f',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      {item.isAvailable ? '● In Stock' : '○ Sold Out'}
                    </button>
                  </td>

                  <td style={{ padding: '0.85rem 0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleViewRecipe(item)} className="btn btn-secondary" style={{ height: '1.8rem', padding: '0 0.5rem', fontSize: '0.7rem' }}>Recipe</button>
                      <button onClick={() => handleOpenModal(item)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)' }} title="Edit"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteItem(item._id, item.name)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d9534f' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ONBOARD / MODIFY MENU ITEM MODAL FORM */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass animate-slide-up" style={{
            width: '600px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editItem ? 'Modify Product Specifications' : 'Onboard Menu Product'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }} className="custom-scroll">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Menu Product Code</label>
                  <input type="text" required placeholder="MENU-CAP-002" value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Category Classification</label>
                  <select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                    <option value="espresso">Espresso</option>
                    <option value="latte">Latte</option>
                    <option value="cappuccino">Cappuccino</option>
                    <option value="mocha">Mocha</option>
                    <option value="americano">Americano</option>
                    <option value="flat_white">Flat White</option>
                    <option value="macchiato">Macchiato</option>
                    <option value="frappuccino">Frappuccino</option>
                    <option value="cold_brew">Cold Brews</option>
                    <option value="soda">Sodas & Cold Drinks</option>
                    <option value="light_bites">Light Bites</option>
                    <option value="pasta">Pasta</option>
                    <option value="sandwich">Sandwich</option>
                    <option value="hot_chocolate">Hot Chocolate</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Product Name</label>
                <input type="text" required placeholder="Classic Cappuccino" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Base Price (₹)</label>
                  <input type="number" required min="0" placeholder="Base cost INR" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>GST Tax Percent (%)</label>
                  <select value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))}>
                    <option value="0">0% Tax</option>
                    <option value="5">5% Tax (Default Cafe)</option>
                    <option value="12">12% Tax</option>
                    <option value="18">18% Tax</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Description Comments (Customer Menu)</label>
                <textarea rows="2" placeholder="Rich espresso layered with warm microfoam..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '0.5rem' }} />
              </div>

              {/* Image url or upload */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Product Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block', flexShrink: 0 }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', height: '2.5rem', fontSize: '0.8rem' }}>
                      <Upload size={14} /> Upload File
                    </button>
                    <input type="file" accept="image/*" onChange={handleImageRead} style={{ position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer', height: '100%' }} />
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Or enter image link URL directly..." 
                    value={imageUrl.startsWith('data:image') ? 'Local File Selected (Base64)' : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={imageUrl.startsWith('data:image')}
                    style={{ flex: 1, height: '2.5rem', fontSize: '0.85rem' }}
                  />
                </div>
                
                {/* Upload Preview */}
                {imageUrl && (
                  <div style={{ marginTop: '0.5rem', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              {/* Nutrition Estimates (Optional) */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                  Nutrition Estimates (Per Serving)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Calories (kcal)</label>
                    <input type="number" min="0" placeholder="e.g. 120" value={calories} onChange={(e) => setCalories(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Carbs (g)</label>
                    <input type="number" step="0.1" min="0" placeholder="e.g. 15" value={carbs} onChange={(e) => setCarbs(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Protein (g)</label>
                    <input type="number" step="0.1" min="0" placeholder="e.g. 2" value={protein} onChange={(e) => setProtein(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fat (g)</label>
                    <input type="number" step="0.1" min="0" placeholder="e.g. 3" value={fat} onChange={(e) => setFat(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="modalIsAvailable"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="modalIsAvailable" style={{ fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>Item is Available (Instantly active in POS)</label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '3.4rem', fontSize: '1.05rem', fontWeight: '700', marginTop: '0.5rem', justifyContent: 'center' }}>
                {editItem ? 'Save Specifications' : 'Onboard Menu Product'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div className="glass animate-slide-up" style={{
            width: '400px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(217, 83, 79, 0.15)',
              color: '#d9534f',
              marginBottom: '1rem'
            }}>
              <Trash2 size={32} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              {confirmModal.title || 'Are you sure?'}
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {confirmModal.message}
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="btn btn-secondary" 
                style={{ flex: 1, height: '2.5rem', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
                className="btn" 
                style={{ 
                  flex: 1, 
                  height: '2.5rem', 
                  backgroundColor: '#d9534f', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISH DETAILS MODAL */}
      {selectedDish && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass animate-slide-up animate-fade-in" style={{
            width: '480px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Close button */}
            <button 
              onClick={() => setSelectedDish(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                border: 'none',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '50%',
                padding: '0.4rem',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <X size={18} />
            </button>

            {/* Top Large Image Cover */}
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: 'var(--border-light)',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
              {selectedDish.imageUrl ? (
                <img 
                  src={selectedDish.imageUrl} 
                  alt={selectedDish.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)' }}>
                  <Coffee size={64} />
                </div>
              )}
            </div>

            {/* Dish Info */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'var(--primary)', 
                fontWeight: '800', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {selectedDish.category.replace('_', ' ')}
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                {selectedDish.name}
              </h2>
              {selectedDish.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {selectedDish.description}
                </p>
              )}
            </div>

            {/* Nutritional metrics grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                Nutrition Estimates (Per Serving)
              </h3>
              {(() => {
                const nut = getNutrition(selectedDish.name);
                const itemCalories = selectedDish.calories !== undefined && selectedDish.calories !== null ? selectedDish.calories : nut.calories;
                const itemCarbs = selectedDish.carbs !== undefined && selectedDish.carbs !== null ? selectedDish.carbs : nut.carbs;
                const itemProtein = selectedDish.protein !== undefined && selectedDish.protein !== null ? selectedDish.protein : nut.protein;
                const itemFat = selectedDish.fat !== undefined && selectedDish.fat !== null ? selectedDish.fat : nut.fat;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>CALORIES</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{itemCalories} kcal</span>
                    </div>
                    <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>CARBS</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{itemCarbs}g</span>
                    </div>
                    <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>PROTEIN</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{itemProtein}g</span>
                    </div>
                    <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>FAT</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{itemFat}g</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Ingredients used */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                Key Ingredients Used
              </h3>
              {selectedDish.recipe && selectedDish.recipe.ingredients && selectedDish.recipe.ingredients.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto' }} className="custom-scroll">
                  {selectedDish.recipe.ingredients.map(ing => (
                    <span 
                      key={ing.id} 
                      style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        padding: '0.35rem 0.75rem', 
                        borderRadius: '20px', 
                        background: 'var(--bg-dark)', 
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      🌱 {ing.rawMaterial ? ing.rawMaterial.name : 'Ingredient'}
                      <span style={{ color: 'var(--primary)', fontWeight: '800' }}>
                        ({ing.quantity} {ing.unit})
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No default recipe configured for this item.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setSelectedDish(null)}
                className="btn btn-secondary" 
                style={{ flex: 1, height: '2.6rem', justifyContent: 'center' }}
              >
                Close Details
              </button>
              <button 
                onClick={() => {
                  const dishToEdit = selectedDish;
                  setSelectedDish(null);
                  handleOpenModal(dishToEdit);
                }}
                className="btn btn-primary" 
                style={{ flex: 1, height: '2.6rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Edit size={16} /> Edit Product
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MenuManager;
