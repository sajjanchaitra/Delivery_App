import React, { useState } from 'react';
import { Search, Plus, Eye, Trash2, UserCheck, UserX, Download, ChevronLeft, ChevronRight, X, Phone, Mail } from 'lucide-react';

const initialUsers = [
  { id: 1, name: 'John Doe', phone: '+91 98765 43210', email: 'john@email.com', role: 'customer', orders: 23, status: 'active', joined: '2024-01-15' },
  { id: 2, name: 'Fresh Mart', phone: '+91 98765 43211', email: 'freshmart@email.com', role: 'vendor', orders: 156, status: 'active', joined: '2024-01-10' },
  { id: 3, name: 'Jane Smith', phone: '+91 98765 43212', email: 'jane@email.com', role: 'customer', orders: 12, status: 'active', joined: '2024-02-20' },
  { id: 4, name: 'Delivery Guy', phone: '+91 98765 43213', email: 'delivery@email.com', role: 'delivery', orders: 89, status: 'active', joined: '2024-01-25' },
  { id: 5, name: 'Mike Johnson', phone: '+91 98765 43214', email: 'mike@email.com', role: 'customer', orders: 5, status: 'inactive', joined: '2024-03-01' },
  { id: 6, name: 'Veggie Hub', phone: '+91 98765 43215', email: 'veggie@email.com', role: 'vendor', orders: 98, status: 'active', joined: '2024-02-05' },
];

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleStatus = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  const deleteUser = (id) => {
    if (window.confirm('Delete this user?')) setUsers(users.filter(u => u.id !== id));
  };

  const getRoleStyle = (role) => {
    const styles = {
      customer: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
      vendor: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
      delivery: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    };
    return styles[role] || styles.customer;
  };

  return (
    <div className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Users</h1>
          <p style={styles.subtitle}>Manage all users</p>
        </div>
        <div style={styles.actions}>
          <button style={styles.btnSecondary}><Download size={18} /> Export</button>
          <button style={styles.btnPrimary}><Plus size={18} /> Add User</button>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} color="var(--text-muted)" />
          <input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInput} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={styles.select}>
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="delivery">Delivery</option>
        </select>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Orders</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const roleStyle = getRoleStyle(user.role);
              return (
                <tr key={user.id}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={{ ...styles.avatar, background: roleStyle.bg, color: roleStyle.color }}>{user.name[0]}</div>
                      <div>
                        <div style={styles.userName}>{user.name}</div>
                        <div style={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{user.phone}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: roleStyle.bg, color: roleStyle.color }}>{user.role}</span></td>
                  <td style={styles.td}>{user.orders}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: user.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: user.status === 'active' ? '#10b981' : '#ef4444' }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: 'var(--text-muted)' }}>{user.joined}</td>
                  <td style={styles.td}>
                    <div style={styles.actionsCell}>
                      <button style={styles.actionBtn} onClick={() => setSelected(user)}><Eye size={16} /></button>
                      <button style={styles.actionBtn} onClick={() => toggleStatus(user.id)}>
                        {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button style={{ ...styles.actionBtn, color: 'var(--danger)' }} onClick={() => deleteUser(user.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={styles.pagination}>
          <span style={styles.pageInfo}>Showing {filtered.length} of {users.length} users</span>
          <div style={styles.pageButtons}>
            <button style={styles.pageBtn}><ChevronLeft size={16} /></button>
            <button style={{ ...styles.pageBtn, background: 'var(--accent)', color: '#fff' }}>1</button>
            <button style={styles.pageBtn}>2</button>
            <button style={styles.pageBtn}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {selected && (
        <div style={styles.modal} onClick={() => setSelected(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>User Details</h3>
              <button style={styles.closeBtn} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalAvatar}>{selected.name[0]}</div>
              <h2 style={{ fontSize: 20, marginBottom: 4 }}>{selected.name}</h2>
              <span style={{ ...styles.badge, ...getRoleStyle(selected.role) }}>{selected.role}</span>
              <div style={styles.detailRow}><Phone size={18} color="var(--accent)" /> {selected.phone}</div>
              <div style={styles.detailRow}><Mail size={18} color="var(--accent)" /> {selected.email}</div>
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
  tableCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 20px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  userCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 },
  userName: { fontWeight: 600 },
  userEmail: { fontSize: 12, color: 'var(--text-muted)' },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' },
  actionsCell: { display: 'flex', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' },
  pageInfo: { fontSize: 13, color: 'var(--text-muted)' },
  pageButtons: { display: 'flex', gap: 6 },
  pageBtn: { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  closeBtn: { width: 34, height: 34, borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24, textAlign: 'center' },
  modalAvatar: { width: 70, height: 70, borderRadius: 16, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28, fontWeight: 700 },
  detailRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', justifyContent: 'center', color: 'var(--text-secondary)' },
};