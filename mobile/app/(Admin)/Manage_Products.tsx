import React, { useState } from 'react';
import { Search, Plus, Eye, Trash2, Edit, Download, ChevronLeft, ChevronRight, X, Package } from 'lucide-react';

const initialProducts = [
  { id: 1, name: 'Fresh Tomatoes', store: 'Fresh Mart', category: 'vegetables', price: 40, stock: true, image: '🍅' },
  { id: 2, name: 'Organic Milk', store: 'Dairy Delight', category: 'dairy', price: 60, stock: true, image: '🥛' },
  { id: 3, name: 'Whole Wheat Bread', store: 'Bakery Plus', category: 'bakery', price: 45, stock: true, image: '🍞' },
  { id: 4, name: 'Green Apples', store: 'Fresh Mart', category: 'fruits', price: 120, stock: true, image: '🍏' },
  { id: 5, name: 'Basmati Rice 5kg', store: 'Veggie Hub', category: 'grocery', price: 350, stock: false, image: '🍚' },
  { id: 6, name: 'Fresh Spinach', store: 'Veggie Hub', category: 'vegetables', price: 30, stock: true, image: '🥬' },
  { id: 7, name: 'Paneer 200g', store: 'Dairy Delight', category: 'dairy', price: 80, stock: true, image: '🧀' },
  { id: 8, name: 'Chocolate Cake', store: 'Bakery Plus', category: 'bakery', price: 450, stock: true, image: '🎂' },
];

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const deleteProduct = (id) => {
    if (window.confirm('Delete this product?')) setProducts(products.filter(p => p.id !== id));
  };

  const getCategoryStyle = (cat) => {
    const styles = {
      vegetables: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
      fruits: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
      dairy: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
      bakery: { bg: 'rgba(236,72,153,0.15)', color: '#ec4899' },
      grocery: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
    };
    return styles[cat] || styles.grocery;
  };

  return (
    <div className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Products</h1>
          <p style={styles.subtitle}>Manage all products across stores</p>
        </div>
        <div style={styles.actions}>
          <button style={styles.btnSecondary}><Download size={18} /> Export</button>
          <button style={styles.btnPrimary}><Plus size={18} /> Add Product</button>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} color="var(--text-muted)" />
          <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInput} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={styles.select}>
          <option value="all">All Categories</option>
          <option value="vegetables">Vegetables</option>
          <option value="fruits">Fruits</option>
          <option value="dairy">Dairy</option>
          <option value="bakery">Bakery</option>
          <option value="grocery">Grocery</option>
        </select>
      </div>

      <div style={styles.grid}>
        {filtered.map(product => {
          const catStyle = getCategoryStyle(product.category);
          return (
            <div key={product.id} style={styles.card}>
              <div style={styles.cardImage}>{product.image}</div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{product.name}</h3>
                <p style={styles.cardStore}>{product.store}</p>
                <div style={styles.cardMeta}>
                  <span style={{ ...styles.badge, background: catStyle.bg, color: catStyle.color }}>{product.category}</span>
                  <span style={{ ...styles.badge, background: product.stock ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: product.stock ? '#10b981' : '#ef4444' }}>
                    {product.stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <div style={styles.cardFooter}>
                  <span style={styles.price}>₹{product.price}</span>
                  <div style={styles.cardActions}>
                    <button style={styles.actionBtn} onClick={() => setSelected(product)}><Eye size={16} /></button>
                    <button style={styles.actionBtn}><Edit size={16} /></button>
                    <button style={{ ...styles.actionBtn, color: 'var(--danger)' }} onClick={() => deleteProduct(product.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={styles.modal} onClick={() => setSelected(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Product Details</h3>
              <button style={styles.closeBtn} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalImage}>{selected.image}</div>
              <h2 style={{ fontSize: 20, marginBottom: 4 }}>{selected.name}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>from {selected.store}</p>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}><span style={styles.detailLabel}>Category</span><span>{selected.category}</span></div>
                <div style={styles.detailItem}><span style={styles.detailLabel}>Price</span><span>₹{selected.price}</span></div>
                <div style={styles.detailItem}><span style={styles.detailLabel}>Stock</span><span>{selected.stock ? 'Available' : 'Out of Stock'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700 },
  subtitle: { color: 'var(--text-muted)', fontSize: 14, marginTop: 4 },
  actions: { display: 'flex', gap: 12 },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  filters: { display: 'flex', gap: 16, marginBottom: 20 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 10, flex: 1, maxWidth: 350 },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14 },
  select: { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
  cardImage: { height: 120, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: 600, marginBottom: 4 },
  cardStore: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 },
  cardMeta: { display: 'flex', gap: 8, marginBottom: 12 },
  badge: { display: 'inline-block', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, textTransform: 'capitalize' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: 700, color: 'var(--accent)' },
  cardActions: { display: 'flex', gap: 4 },
  actionBtn: { width: 30, height: 30, borderRadius: 6, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  closeBtn: { width: 34, height: 34, borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24, textAlign: 'center' },
  modalImage: { width: 80, height: 80, background: 'var(--bg-hover)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 16px' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 },
  detailItem: { background: 'var(--bg-hover)', borderRadius: 10, padding: 12, textAlign: 'center' },
  detailLabel: { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 },
};