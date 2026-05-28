import React, { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../App';
import { 
  Package, Plus, Edit, Trash2, Calendar, FileText, X, AlertTriangle, ArrowRight, DollarSign, Filter, RefreshCw
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

const InventoryDashboard = ({ userRole }) => {
  const { showToast } = useContext(ToastContext);
  const auth = JSON.parse(localStorage.getItem('userInfo')) || {};

  // Active view tabs: 'stock' or 'transactions'
  const [activeTab, setActiveTab] = useState('stock');

  // Roster States
  const [rawMaterials, setRawMaterials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [restockId, setRestockId] = useState(null);
  const [restockItemName, setRestockItemName] = useState('');

  // Form Fields
  const [itemCode, setItemCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('coffee_beans');

  // Auto-generate code on Category Change
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const nextCode = generateNextCode(newCat, rawMaterials);
    setItemCode(nextCode);
  };
  const [unit, setUnit] = useState('g');
  const [currentStock, setCurrentStock] = useState('');
  const [minimumStockLevel, setMinimumStockLevel] = useState('');
  const [reorderQuantity, setReorderQuantity] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [totalPurchaseCost, setTotalPurchaseCost] = useState('');
  const [quantityPerPack, setQuantityPerPack] = useState('');
  const [packCapacityUnit, setPackCapacityUnit] = useState('ml');
  const [supplierId, setSupplierId] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Restock Field
  const [restockQty, setRestockQty] = useState('');
  const [restockTotalCost, setRestockTotalCost] = useState('');
  const [restockReorderQty, setRestockReorderQty] = useState('');
  const [restockNotes, setRestockNotes] = useState('');

  const categories = [
    { value: 'coffee_beans', label: 'Coffee Beans' },
    { value: 'milk_dairy', label: 'Milk & Dairy' },
    { value: 'syrups_sauces', label: 'Syrups & Sauces' },
    { value: 'bakery', label: 'Bakery Pastries' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'packaging', label: 'Packaging Cups' },
    { value: 'cleaning', label: 'Cleaning Supplies' },
    { value: 'other', label: 'Other Items' }
  ];

  const units = ['ml', 'l', 'g', 'kg', 'pinch', 'piece', 'tsp', 'tbsp', 'cup', 'bottle', 'pouch', 'pack'];

  const fetchData = async () => {
    try {
      // 1. Fetch Raw Materials
      const res = await fetch('/api/inventory', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (res.ok) setRawMaterials(data);

      // 2. Fetch Suppliers for dropdown links
      const supRes = await fetch('/api/suppliers', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const supData = await supRes.json();
      if (supRes.ok) setSuppliers(supData);

      // 3. Fetch Stock Transactions Ledger
      const txRes = await fetch('/api/inventory/transactions', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const txData = await txRes.json();
      if (txRes.ok) setTransactions(txData);

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary Metrics calculations
  const calculateAssets = () => {
    let totalVal = 0;
    let lowCount = 0;
    let outCount = 0;

    rawMaterials.forEach(m => {
      totalVal += Number(m.totalValue || 0);
      if (m.currentStock === 0) outCount++;
      else if (m.currentStock <= m.minimumStockLevel) lowCount++;
    });

    return { totalVal, lowCount, outCount };
  };

  const assets = calculateAssets();

  // Status Badge Colors
  const getBadgeStyle = (status) => {
    switch (status) {
      case 'in_stock': return { label: 'In Stock', color: '#5cb85c', bg: 'rgba(92,184,92,0.15)' };
      case 'low_stock': return { label: 'Low Stock', color: '#f0ad4e', bg: 'rgba(240,173,78,0.15)' };
      case 'out_of_stock': return { label: 'Out of Stock', color: '#d9534f', bg: 'rgba(217,83,79,0.15)' };
      default: return { label: 'Unknown', color: 'var(--text-muted)', bg: 'var(--border)' };
    }
  };

  // CRUD triggers: raw material
  const handleOpenFormModal = (m = null) => {
    if (m) {
      setEditId(m._id);
      setItemCode(m.itemCode);
      setName(m.name);
      setCategory(m.category);
      setUnit(m.unit);
      setCurrentStock(m.currentStock);
      setMinimumStockLevel(m.minimumStockLevel);
      setReorderQuantity(m.reorderQuantity || '');
      setCostPerUnit(m.costPerUnit || '');
      setTotalPurchaseCost((Number(m.costPerUnit || 0) * Number(m.currentStock || 0)).toFixed(2));
      setQuantityPerPack(m.quantityPerPack || '');
      setPackCapacityUnit(m.packCapacityUnit || 'ml');
      setSupplierId(m.supplierId || '');
      setStorageLocation(m.storageLocation || '');
      setExpiryDate(m.expiryDate ? m.expiryDate.split('T')[0] : '');
    } else {
      setEditId(null);
      setName('');
      setCategory('coffee_beans');
      const nextCode = generateNextCode('coffee_beans', rawMaterials);
      setItemCode(nextCode);
      setUnit('g');
      setCurrentStock('');
      setMinimumStockLevel('');
      setReorderQuantity('');
      setCostPerUnit('');
      setTotalPurchaseCost('');
      setQuantityPerPack('');
      setPackCapacityUnit('ml');
      setSupplierId('');
      setStorageLocation('');
      setExpiryDate('');
    }
    setShowFormModal(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();

    let calculatedCostPerUnit = Number(costPerUnit || 0);
    if (totalPurchaseCost !== '') {
      const stockVal = Number(currentStock || 0);
      calculatedCostPerUnit = stockVal > 0 ? Number(totalPurchaseCost) / stockVal : 0;
    }

    const payload = {
      itemCode,
      name,
      category,
      unit,
      currentStock: Number(currentStock),
      minimumStockLevel: Number(minimumStockLevel),
      costPerUnit: calculatedCostPerUnit,
      supplierId: supplierId || null,
      storageLocation,
      expiryDate: expiryDate || null,
      quantityPerPack: ['bottle', 'pouch', 'pack'].includes(unit) ? Number(quantityPerPack) : null,
      packCapacityUnit: ['bottle', 'pouch', 'pack'].includes(unit) ? packCapacityUnit : null
    };

    const url = editId ? `/api/inventory/${editId}` : '/api/inventory';
    const method = editId ? 'PUT' : 'POST';

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
        showToast('Inventory material saved successfully!', 'success');
        setShowFormModal(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Saving failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteMaterial = async (id, mName) => {
    if (!window.confirm(`Delete ${mName} from inventory rosters? This will clear stock transaction histories too.`)) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.ok) {
        showToast('Raw material removed', 'success');
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.message || 'Deletion failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Restocking Modal Trigger
  const handleOpenRestock = (m) => {
    setRestockId(m._id);
    setRestockItemName(m.name);
    setRestockQty(m.reorderQuantity || 50);
    setRestockNotes('Standard manual stock replenishment');
    setRestockTotalCost('');
    setRestockReorderQty(m.reorderQuantity || 50);
    setShowRestockModal(true);
  };

  const handleSaveRestock = async (e) => {
    e.preventDefault();

    if (!restockQty || Number(restockQty) <= 0) {
      showToast('Quantity must be greater than 0', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${restockId}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ 
          quantity: Number(restockQty), 
          totalCost: restockTotalCost ? Number(restockTotalCost) : null,
          reorderQuantity: restockReorderQty ? Number(restockReorderQty) : null,
          notes: restockNotes 
        })
      });
      if (res.ok) {
        showToast(`Stock replenished for ${restockItemName}!`, 'success');
        setShowRestockModal(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Restock failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter raw materials list locally
  const filteredMaterials = rawMaterials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter ? m.category === categoryFilter : true;
    const matchesStatus = statusFilter ? m.status === statusFilter : true;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const isBarista = userRole === 'barista';

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass skeleton" style={{ height: '100px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>Inventory Stock</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Monitor raw physical materials, safety alert thresholds, reorders, and stock transaction trace logs.</span>
        </div>

        {!isBarista && (
          <button onClick={() => handleOpenFormModal()} className="btn btn-primary" style={{ height: '2.5rem', padding: '0 1.25rem' }}>
            <Plus size={16} /> Add Material
          </button>
        )}
      </div>

      {/* Asset summaries top decks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="mobile-stack">
        <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(140, 98, 57, 0.1)', color: 'var(--primary)' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>TOTAL INVENTORY ASSET VALUE</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{assets.totalVal?.toFixed(1)}</span>
          </div>
        </div>

        <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #f0ad4e', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(240, 173, 78, 0.15)', color: '#f0ad4e' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>LOW STOCK ITEMS ALERT</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: assets.lowCount > 0 ? '#f0ad4e' : 'var(--text-main)' }}>{assets.lowCount} item(s)</span>
          </div>
        </div>

        <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #d9534f', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(217, 83, 79, 0.15)', color: '#d9534f' }}>
            <X size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>OUT OF STOCK CRITICAL</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: assets.outCount > 0 ? '#d9534f' : 'var(--text-main)' }}>{assets.outCount} item(s)</span>
          </div>
        </div>
      </div>

      {/* Tabs list (Stock levels vs Transaction logs) */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'stock' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'stock' ? 'white' : 'var(--text-muted)',
            transition: 'var(--transition)'
          }}
        >
          Raw Materials Stock Levels
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'transactions' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'transactions' ? 'white' : 'var(--text-muted)',
            transition: 'var(--transition)'
          }}
        >
          Stock Transaction History Logs
        </button>
      </div>

      {/* TAB CONTENT 1: STOCK LEVELS */}
      {activeTab === 'stock' && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Advanced filters console */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
            <Filter size={16} color="var(--text-subtle)" />
            
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '180px', height: '2.2rem', fontSize: '0.8rem', borderRadius: '4px' }}
            />

            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '140px', height: '2.2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '130px', height: '2.2rem', padding: '0 0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
            >
              <option value="">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {(searchTerm || categoryFilter || statusFilter) && (
              <button 
                onClick={() => { setSearchTerm(''); setCategoryFilter(''); setStatusFilter(''); }}
                style={{ border: 'none', background: 'transparent', color: '#d9534f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', fontWeight: '700' }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Raw Materials Stocks Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Code</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Current Stock</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Cost/Unit</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Total Assets Value</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Supplier</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Safety Status</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-subtle)' }}>No materials found.</td>
                  </tr>
                ) : (
                  filteredMaterials.map(m => {
                    const badge = getBadgeStyle(m.status);
                    return (
                      <tr key={m._id} className="hover-brighten">
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-subtle)', fontSize: '0.75rem', fontWeight: '700' }}>{m.itemCode}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>{m.name}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>{m.category.replace('_', ' ')}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: '700', fontSize: '0.85rem' }}>
                          {(() => {
                            const stock = Number(m.currentStock);
                            const unit = m.unit || '';
                            if (stock >= 1000 && (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gm' || unit.toLowerCase() === 'ml')) {
                              const convertedVal = (stock / 1000).toFixed(1);
                              const convertedUnit = unit.toLowerCase() === 'ml' ? 'L' : 'kg';
                              return `${convertedVal} ${convertedUnit}`;
                            }
                            return `${m.currentStock} ${m.unit}`;
                          })()}
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}>₹{Number(m.costPerUnit).toFixed(2)}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: '800', color: 'var(--primary)' }}>₹{m.totalValue?.toFixed(1)}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.supplier ? m.supplier.name : 'None'}</td>
                        
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '30px',
                            backgroundColor: badge.bg,
                            color: badge.color
                          }}>{badge.label}</span>
                        </td>

                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              onClick={() => handleOpenRestock(m)} 
                              className="btn btn-secondary" 
                              style={{ height: '1.8rem', padding: '0 0.5rem', fontSize: '0.7rem', fontWeight: '700', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                            >
                              Restock
                            </button>
                            
                            {!isBarista && (
                              <>
                                <button onClick={() => handleOpenFormModal(m)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }} title="Edit"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteMaterial(m._id, m.name)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d9534f', padding: '0.25rem' }} title="Delete"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: TRANSACTION HISTORY LOGS */}
      {activeTab === 'transactions' && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--primary)" /> Stock Transaction Ledger
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Material</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Quantity</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Logged notes comments</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-subtle)' }}>No stock transactions recorded in ledger.</td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx._id} className="hover-brighten">
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-subtle)', fontSize: '0.75rem' }}>{new Date(tx.created_at).toLocaleString()}</td>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>{tx.rawMaterial ? tx.rawMaterial.name : 'Unknown Material'}</td>
                    
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '30px',
                        backgroundColor: tx.transaction_type === 'restock' ? 'rgba(92,184,92,0.15)' : (tx.transaction_type === 'deduction' ? 'rgba(91,192,222,0.15)' : 'rgba(217,83,79,0.15)'),
                        color: tx.transaction_type === 'restock' ? '#5cb85c' : (tx.transaction_type === 'deduction' ? '#5bc0de' : '#d9534f')
                      }}>{tx.transaction_type}</span>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: '700' }}>
                      {tx.transaction_type === 'deduction' || tx.transaction_type === 'waste' ? '-' : '+'}
                      {(() => {
                        const qty = Number(tx.quantity);
                        const unit = tx.rawMaterial?.unit || '';
                        if (qty >= 1000 && (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gm' || unit.toLowerCase() === 'ml')) {
                          const convertedVal = (qty / 1000).toFixed(1);
                          const convertedUnit = unit.toLowerCase() === 'ml' ? 'L' : 'kg';
                          return `${convertedVal} ${convertedUnit}`;
                        }
                        return `${tx.quantity} ${unit}`;
                      })()}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{tx.notes || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD MODAL FOR ADDING / EDITING RAW MATERIALS */}
      {showFormModal && (
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
            width: '560px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editId ? 'Modify Material Specifications' : 'Onboard Raw Material'}
              </h3>
              <button onClick={() => setShowFormModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }} className="custom-scroll">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Material Item Code</label>
                  <input type="text" required placeholder="RM-COF-001" value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Category Segment</label>
                  <select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Product Name</label>
                  <input type="text" required placeholder="Whole Milk / Espresso Beans" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Inventory Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {['bottle', 'pouch', 'pack'].includes(unit) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>Capacity per {unit}</label>
                    <input type="number" required placeholder="e.g. 750" value={quantityPerPack} onChange={(e) => setQuantityPerPack(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>Capacity Base Unit</label>
                    <select value={packCapacityUnit} onChange={(e) => setPackCapacityUnit(e.target.value)}>
                      <option value="ml">ml (milliliters)</option>
                      <option value="l">L (liters)</option>
                      <option value="g">g (grams)</option>
                      <option value="kg">kg (kilograms)</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Current Stock Level</label>
                  <input type="number" required placeholder="e.g. 10" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Total Purchase Cost (₹)</label>
                  <input type="number" step="any" required placeholder="e.g. 500" value={totalPurchaseCost} onChange={(e) => setTotalPurchaseCost(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Minimum Safety Level</label>
                  <input type="number" required placeholder="e.g. 2" value={minimumStockLevel} onChange={(e) => setMinimumStockLevel(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Expiry Date (Optional)</label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Link Supplier Vendor</label>
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    <option value="">-- No linked supplier --</option>
                    {suppliers.map(sup => (
                      <option key={sup._id} value={sup._id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Storage Location</label>
                  <input type="text" placeholder="Fridge Shelf A" value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-save-large" style={{ marginTop: '0.5rem' }}>
                Save Raw Material Specifications
              </button>

            </form>
          </div>
        </div>
      )}

      {/* RESTOCK DIALOG POPUP MODAL */}
      {showRestockModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass" style={{
            width: '400px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-panel)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Restock Material: {restockItemName}
              </h3>
              <button onClick={() => setShowRestockModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveRestock} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Replenishment Qty</label>
                  <input type="number" required min="1" placeholder="e.g. 5" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Next Reorder Alert Qty</label>
                  <input type="number" required placeholder="e.g. 5" value={restockReorderQty} onChange={(e) => setRestockReorderQty(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Total Cost of Batch (₹) [Optional]</label>
                <input type="number" step="any" placeholder="e.g. 250" value={restockTotalCost} onChange={(e) => setRestockTotalCost(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Transaction Notes Comments</label>
                <textarea rows="3" placeholder="Restock batch order #414 intake." value={restockNotes} onChange={(e) => setRestockNotes(e.target.value)} style={{ padding: '0.5rem' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '2.6rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                replenish stock & Log transaction
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryDashboard;
