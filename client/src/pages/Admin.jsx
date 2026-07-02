import AdminSettings from './AdminSettings';
import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, api } from '../stores';
import { productService, orderService } from '../services/api';


// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'sage' }) {
  const bg = { sage:'#e8f2e8', gold:'#fdf8ec', blue:'#e8f0fe', red:'#fef2f2' }[color];
  return (
    <div className="bg-white rounded-2xl border border-[#ede9e2] p-5">
      <div className="inline-flex p-2.5 rounded-xl mb-3" style={{ background: bg }}>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-[#141414] mb-1">{value}</div>
      <div className="text-sm font-medium text-[#5a5a5a]">{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: '#999' }}>{sub}</div>}
    </div>
  );
}

// ─── PRODUCT FORM MODAL ───────────────────────────────────────────────────────

const EMPTY_PRODUCT = {
  type: 'footwear', name: '', slug: '', category: '', price: '', compareAtPrice: '',
  shortDescription: '', description: '', stock: '', status: 'active', featured: false,
  images: '',
  sizes: '', heelHeight: '', material: '', occasion: '',
  height: '', width: '', depth: '', weight: '', room: '', style: '', indoorOutdoor: 'indoor',
};

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!product) return EMPTY_PRODUCT;
    const fw = product.footwearDetails || {};
    const dc = product.decorDetails    || {};
    return {
      type:             product.type || 'footwear',
      name:             product.name || '',
      slug:             product.slug || '',
      category:         product.category || '',
      price:            product.price || '',
      compareAtPrice:   product.compareAtPrice || '',
      shortDescription: product.shortDescription || '',
      description:      product.description || '',
      stock:            product.stock ?? '',
      status:           product.status || 'active',
      featured:         product.featured || false,
      images:           product.images?.join(', ') || '',
      sizes:            fw.sizes?.join(', ') || '',
      heelHeight:       fw.heelHeight || '',
      material:         fw.material || dc.material || '',
      occasion:         fw.occasion?.join(', ') || '',
      height:           dc.dimensions?.height || '',
      width:            dc.dimensions?.width  || '',
      depth:            dc.dimensions?.depth  || '',
      weight:           dc.weight || '',
      room:             dc.room?.join(', ') || '',
      style:            dc.style?.join(', ') || '',
      indoorOutdoor:    dc.indoorOutdoor || 'indoor',
    };
  });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleNameChange = (val) => {
    set('name', val);
    if (!product) {
      set('slug', val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      setError('Name, price and category are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        type:             form.type,
        name:             form.name,
        slug:             form.slug,
        category:         form.category,
        price:            Number(form.price),
        compareAtPrice:   Number(form.compareAtPrice) || 0,
        shortDescription: form.shortDescription,
        description:      form.description,
        stock:            Number(form.stock) || 0,
        status:           form.status,
        featured:         form.featured,
        images:           form.images.split(',').map(s => s.trim()).filter(Boolean),
        sku:              product?.sku || `E256-${Date.now()}`,
      };

      if (form.type === 'footwear') {
        payload.footwearDetails = {
          sizes:      form.sizes.split(',').map(s => Number(s.trim())).filter(Boolean),
          heelHeight: Number(form.heelHeight) || 0,
          material:   form.material,
          occasion:   form.occasion.split(',').map(s => s.trim()).filter(Boolean),
        };
      } else if (form.type === 'decor') {
        payload.decorDetails = {
          dimensions: {
            height: Number(form.height) || 0,
            width:  Number(form.width)  || 0,
            depth:  Number(form.depth)  || 0,
          },
          weight:        Number(form.weight) || 0,
          material:      form.material,
          room:          form.room.split(',').map(s => s.trim()).filter(Boolean),
          style:         form.style.split(',').map(s => s.trim()).filter(Boolean),
          indoorOutdoor: form.indoorOutdoor,
        };
      }

      if (product?._id) {
        await productService.update(product._id, payload);
      } else {
        await productService.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors bg-white";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-5 md:pt-10 px-2 md:px-4 pb-5 md:pb-10 overflow-y-auto"
         style={{ background: 'rgba(0,0,0,.45)' }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl"
           style={{ boxShadow: '0 24px 80px rgba(0,0,0,.18)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#ede9e2]">
          <h2 className="text-lg font-semibold">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#999] hover:bg-[#f5f2ed] transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          {error && (
            <div className="rounded-xl p-3 text-sm bg-[#fef2f2] text-[#e05252] border border-[#fecaca]">
              {error}
            </div>
          )}

          {/* Type */}
          <div>
            <label className={labelCls}>Product Type</label>
            <div className="flex gap-3">
              {['footwear', 'decor', 'accessories'].map(t => (
                <label key={t} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                  form.type===t ? 'border-[#2C5F2D] bg-[#e8f2e8] text-[#2C5F2D] font-medium' : 'border-[#ede9e2] text-[#5a5a5a]'
                }`}>
                  <input type="radio" name="type" value={t} checked={form.type===t}
                         onChange={() => set('type', t)} className="sr-only" />
                  {t === 'footwear' ? '👟 Footwear' : t === 'decor' ? '🏺 Decor' : '🛍️ Accessories'}
                </label>
              ))}
            </div>
          </div>

          {/* Name + Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Product Name *</label>
              <input value={form.name} onChange={e => handleNameChange(e.target.value)}
                     placeholder="Classic Pump Heels" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>URL Slug *</label>
              <input value={form.slug} onChange={e => set('slug', e.target.value)}
                     placeholder="classic-pump-heels" className={inputCls} />
            </div>
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category *</label>
              <input value={form.category} onChange={e => set('category', e.target.value)}
                     placeholder={form.type==='footwear' ? 'Heels / Sneakers / Boots' : form.type==='decor' ? 'Vases / Lighting' : 'Bags / Jewelry / Belts'} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Price + Compare + Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Price (UGX) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                     placeholder="145000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Compare At (UGX)</label>
              <input type="number" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)}
                     placeholder="195000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stock</label>
              <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)}
                     placeholder="20" className={inputCls} />
            </div>
          </div>

          {/* Short description */}
          <div>
            <label className={labelCls}>Short Description</label>
            <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                   placeholder="One-line product summary" className={inputCls} />
          </div>

          {/* Full description */}
          <div>
            <label className={labelCls}>Full Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
                      rows={3} placeholder="Detailed product description..."
                      className={inputCls + ' resize-none'} />
          </div>

          {/* Images */}
          <div>
            <label className={labelCls}>Image URLs (comma-separated)</label>
            <textarea value={form.images} onChange={e => set('images', e.target.value)}
                      rows={2} placeholder="https://images.unsplash.com/..., https://..."
                      className={inputCls + ' resize-none'} />
            <p className="text-[11px] text-[#999] mt-1">Paste Unsplash or Cloudinary URLs separated by commas</p>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.featured}
                   onChange={e => set('featured', e.target.checked)}
                   className="w-4 h-4 accent-[#2C5F2D]" />
            <span className="text-sm text-[#5a5a5a]">Mark as featured product</span>
          </label>

          {/* ── FOOTWEAR FIELDS ── */}
          {form.type === 'footwear' && (
            <div className="space-y-4 pt-2 border-t border-[#ede9e2]">
              <div className="text-xs font-bold uppercase tracking-wide text-[#999]">Footwear Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>EU Sizes (comma-separated)</label>
                  <input value={form.sizes} onChange={e => set('sizes', e.target.value)}
                         placeholder="36, 37, 38, 39, 40, 41" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Heel Height (cm)</label>
                  <input type="number" value={form.heelHeight} onChange={e => set('heelHeight', e.target.value)}
                         placeholder="9" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Material</label>
                  <input value={form.material} onChange={e => set('material', e.target.value)}
                         placeholder="Italian Leather" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Occasion (comma-separated)</label>
                  <input value={form.occasion} onChange={e => set('occasion', e.target.value)}
                         placeholder="Office, Evening, Formal" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ── DECOR FIELDS ── */}
          {form.type === 'decor' && (
            <div className="space-y-4 pt-2 border-t border-[#ede9e2]">
              <div className="text-xs font-bold uppercase tracking-wide text-[#999]">Decor Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Height (cm)</label>
                  <input type="number" value={form.height} onChange={e => set('height', e.target.value)}
                         placeholder="60" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Width (cm)</label>
                  <input type="number" value={form.width} onChange={e => set('width', e.target.value)}
                         placeholder="90" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Weight (kg)</label>
                  <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                         placeholder="2.5" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Material</label>
                  <input value={form.material} onChange={e => set('material', e.target.value)}
                         placeholder="Stoneware Ceramic" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Indoor / Outdoor</label>
                  <select value={form.indoorOutdoor} onChange={e => set('indoorOutdoor', e.target.value)} className={inputCls}>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Room (comma-separated)</label>
                  <input value={form.room} onChange={e => set('room', e.target.value)}
                         placeholder="Living Room, Bedroom" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Style (comma-separated)</label>
                  <input value={form.style} onChange={e => set('style', e.target.value)}
                         placeholder="Boho, Minimalist" className={inputCls} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#ede9e2]">
          <button onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-[#ede9e2] text-sm text-[#5a5a5a] hover:bg-[#faf7f2] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: '#2C5F2D' }}>
            {saving
              ? <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Saving...
                </span>
              : product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD OVERVIEW ───────────────────────────────────────────────────────

function DashboardHome() {
  const [stats,  setStats]  = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').catch(() => null),
      orderService.getMyOrders().catch(() => ({ data: [] })),
    ]).then(([statsRes, ordersRes]) => {
      if (statsRes?.data) setStats(statsRes.data);
      setOrders(ordersRes.data?.slice(0, 5) || []);
    });
  }, []);

  const STATUS_COLOR = {
    delivered: 'bg-green-100 text-green-700',
    shipped:   'bg-blue-100 text-blue-700',
    processing:'bg-yellow-100 text-yellow-700',
    pending:   'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl font-medium mb-1">Dashboard</h2>
        <p className="text-sm text-[#999]">Overview of your store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue"  value={stats ? `UGX ${(stats.totalRevenue/1e6).toFixed(1)}M` : '—'} sub="All time" color="sage" />
        <StatCard icon="📦" label="Total Orders"   value={stats?.totalOrders   ?? '—'} sub="All statuses"  color="blue" />
        <StatCard icon="👥" label="Customers"       value={stats?.totalCustomers ?? '—'} sub="Registered"    color="gold" />
        <StatCard icon="🛍️" label="Active Products" value={stats?.totalProducts ?? '—'} sub={`${stats?.lowStock ?? 0} low stock`} color="red" />
      </div>

      <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 overflow-hidden">
        <h3 className="font-semibold mb-4">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-[#999] py-4 text-center">No orders yet</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-[#999] uppercase tracking-wide border-b border-[#f5f2ed]">
                    <th className="pb-3 font-medium whitespace-nowrap">Order</th>
                    <th className="pb-3 font-medium whitespace-nowrap">Total</th>
                    <th className="pb-3 font-medium whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f2ed]">
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td className="py-3 font-medium text-[#2C5F2D] whitespace-nowrap">{o.orderNumber}</td>
                      <td className="py-3 font-semibold whitespace-nowrap">UGX {o.total?.toLocaleString()}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[o.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {o.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PRODUCTS ADMIN ───────────────────────────────────────────────────────────

function ProductsAdmin() {
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalProduct, setModalProduct] = useState(undefined);
  const [deleteId,     setDeleteId]     = useState(null);
  const [search,       setSearch]       = useState('');

  const load = () => {
    setLoading(true);
    productService.list({ limit: 100 })
      .then(({ data }) => setProducts(data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleStatus = async (p) => {
    const newStatus = p.status === 'active' ? 'draft' : 'active';
    await productService.update(p._id, { status: newStatus });
    setProducts(prev => prev.map(x => x._id === p._id ? { ...x, status: newStatus } : x));
  };

  const handleDelete = async (id) => {
    await productService.delete(id);
    setProducts(prev => prev.filter(x => x._id !== id));
    setDeleteId(null);
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-semibold text-2xl font-medium mb-1">Products</h2>
          <p className="text-sm text-[#999]">{products.length} products total</p>
        </div>
        <button onClick={() => setModalProduct(null)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors self-start sm:self-auto"
                style={{ background: '#2C5F2D' }}>
          <span className="text-base leading-none">+</span> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="Search products by name or category..."
               className="w-full max-w-sm px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#f5f2ed] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#999]">
          <div className="text-4xl mb-3">🛍️</div>
          <p className="font-medium">No products found</p>
        </div>
      ) : (
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf7f2] text-left text-[11px] text-[#999] uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Product</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Type</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Price</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Stock</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f2ed]">
                {filtered.map(p => (
                  <tr key={p._id} className="hover:bg-[#faf7f2]/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name}
                               className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#f5f2ed] flex items-center justify-center text-lg flex-shrink-0">
                            {p.type === 'footwear' ? '👟' : p.type === 'decor' ? '🏺' : '🛍️'}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[#141414]">{p.name}</div>
                          <div className="text-xs text-[#999]">{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.type === 'footwear' ? 'bg-[#e8f2e8] text-[#2C5F2D]' : p.type === 'decor' ? 'bg-[#fdf8ec] text-[#b8973a]' : 'bg-[#e0f2fe] text-[#0369a1]'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#141414] whitespace-nowrap">
                      UGX {p.price?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={p.stock < 10 ? 'text-orange-500 font-semibold' : 'text-[#5a5a5a]'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button onClick={() => handleToggleStatus(p)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                p.status === 'active'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}>
                        {p.status}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setModalProduct(p)}
                                className="text-xs font-medium text-[#2C5F2D] hover:underline">
                          Edit
                        </button>
                        <button onClick={() => setDeleteId(p._id)}
                                className="text-xs font-medium text-[#e05252] hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modalProduct !== undefined && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(undefined)}
          onSaved={() => { setModalProduct(undefined); load(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
             style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"
               style={{ boxShadow: '0 24px 80px rgba(0,0,0,.18)' }}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-semibold text-lg mb-2">Delete product?</h3>
            <p className="text-sm text-[#999] mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)}
                      className="px-5 py-2.5 rounded-full border border-[#ede9e2] text-sm text-[#5a5a5a] hover:bg-[#faf7f2] transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                      className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
                      style={{ background: '#e05252' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ORDERS ADMIN ─────────────────────────────────────────────────────────────

const STATUS_FLOW = ['pending','processing','shipped','delivered','cancelled'];

const STATUS_COLOR = {
  delivered: 'bg-green-100 text-green-700',
  shipped:   'bg-blue-100 text-blue-700',
  processing:'bg-yellow-100 text-yellow-700',
  pending:   'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};

function OrderDrawer({ order, onClose, onUpdated }) {
  const [status,   setStatus]   = useState(order.orderStatus || 'pending');
  const [note,     setNote]     = useState('');
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const customer = order.customerId || {};
  const addr     = order.shippingAddress || {};
  const items    = order.items || [];

  async function handleSave() {
    if (status === order.orderStatus) return;
    setSaving(true);
    try {
      await api.patch(`/orders/${order._id || order.id}/status`, {
        orderStatus: status,
        note:        note.trim() || `Status updated to ${status}`,
        trackingNumber: tracking.trim() || undefined,
      });
      setSaved(true);
      onUpdated(order._id || order.id, status, tracking.trim());
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
        style={{ animation: 'slideInRight 0.25s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ede9e2]">
          <div>
            <div className="font-semibold text-[#2C5F2D] text-base">{order.orderNumber}</div>
            <div className="text-xs text-[#999] mt-0.5">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-UG',{day:'numeric',month:'short',year:'numeric'}) : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f2ed] text-[#999] text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Customer */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#999] mb-2">Customer</div>
            <div className="bg-[#faf7f2] rounded-xl p-4 text-sm space-y-1">
              <div className="font-semibold text-[#141414]">
                {customer.name || order.guestInfo?.name || '—'}
                {order.guestInfo && <span className="ml-2 text-[10px] bg-[#ede9e2] text-[#5a5a5a] px-2 py-0.5 rounded-full">Guest</span>}
              </div>
              {(customer.email || order.guestInfo?.email) &&
                <div className="text-[#5a5a5a]">{customer.email || order.guestInfo?.email}</div>}
              {(customer.phone || order.guestInfo?.phone) &&
                <div className="text-[#5a5a5a]">{customer.phone || order.guestInfo?.phone}</div>}
            </div>
          </div>

          {/* Delivery */}
          {addr.city && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#999] mb-2">Delivery Address</div>
              <div className="bg-[#faf7f2] rounded-xl p-4 text-sm text-[#5a5a5a] space-y-0.5">
                {addr.name && <div className="font-semibold text-[#141414]">{addr.name}</div>}
                <div>{addr.city}{addr.district ? `, ${addr.district}` : ''}</div>
                {addr.country && <div>{addr.country}</div>}
                {order.deliveryZone && <div className="text-xs text-[#999] mt-1">Zone: {order.deliveryZone}</div>}
              </div>
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#999] mb-2">Items ({items.length})</div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#faf7f2] rounded-xl p-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#141414] truncate">{item.name}</div>
                      <div className="text-xs text-[#999]">
                        {item.size ? `EU ${item.size} · ` : ''}{item.color ? `${item.color} · ` : ''}Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[#2C5F2D] whitespace-nowrap">
                      UGX {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order summary */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#999] mb-2">Summary</div>
            <div className="bg-[#faf7f2] rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between text-[#5a5a5a]">
                <span>Subtotal</span><span>UGX {order.subtotal?.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>− UGX {order.discountAmount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5a5a5a]">
                <span>Delivery</span><span>UGX {order.shippingFee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#141414] pt-2 border-t border-[#ede9e2]">
                <span>Total</span><span style={{color:'#2C5F2D'}}>UGX {order.total?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-[#999] pt-1">
                <span>Payment</span>
                <span className={`font-medium ${order.paymentStatus==='paid'?'text-green-600':order.paymentStatus==='failed'?'text-red-500':'text-[#999]'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#999] mb-2">Status History</div>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3 items-start text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#2C5F2D] mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium capitalize">{h.status}</span>
                      {h.note && <span className="text-[#999] ml-1">— {h.note}</span>}
                      <div className="text-[11px] text-[#bbb]">
                        {h.updatedAt ? new Date(h.updatedAt).toLocaleString('en-UG') : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: status update controls */}
        <div className="px-6 py-4 border-t border-[#ede9e2] bg-white space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1">Update Order Status</div>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm bg-white focus:outline-none focus:border-[#2C5F2D]"
          >
            {STATUS_FLOW.map(s => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {status === 'shipped' && (
            <input
              type="text"
              placeholder="Tracking number (optional)"
              value={tracking}
              onChange={e => setTracking(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm focus:outline-none focus:border-[#2C5F2D]"
            />
          )}

          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm focus:outline-none focus:border-[#2C5F2D]"
          />

          <button
            onClick={handleSave}
            disabled={saving || status === order.orderStatus}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: saved ? '#27ae60' : '#2C5F2D' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Status Updated' : 'Save Status'}
          </button>
          {status === order.orderStatus && (
            <p className="text-center text-xs text-[#bbb]">Change the status above to save</p>
          )}
          {status === 'shipped' && status !== order.orderStatus && (
            <p className="text-center text-xs text-[#2C5F2D]">📱 Customer will receive an SMS notification</p>
          )}
        </div>
      </div>
    </>
  );
}

function OrdersAdmin() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/admin/orders', { params: { limit: 50 } })
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleUpdated(id, newStatus, newTracking) {
    setOrders(prev => prev.map(o =>
      (o._id === id || o.id === id)
        ? { ...o, orderStatus: newStatus, trackingNumber: newTracking || o.trackingNumber }
        : o
    ));
    setSelected(prev => prev ? { ...prev, orderStatus: newStatus, trackingNumber: newTracking || prev.trackingNumber } : null);
  }

  return (
    <div>
      <h2 className="font-semibold text-2xl font-medium mb-6">Orders</h2>
      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-14 bg-[#f5f2ed] rounded-xl animate-pulse"/>)}</div>
      ) : (
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf7f2] text-left text-[11px] text-[#999] uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Order</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Total</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Payment</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f2ed]">
                {orders.map(o => (
                  <tr
                    key={o._id}
                    className="hover:bg-[#faf7f2]/50 cursor-pointer"
                    onClick={() => setSelected(o)}
                  >
                    <td className="px-5 py-3.5 font-medium text-[#2C5F2D] whitespace-nowrap">{o.orderNumber}</td>
                    <td className="px-5 py-3.5 text-[#5a5a5a] whitespace-nowrap">{o.customerId?.name || o.guestInfo?.name || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold whitespace-nowrap">UGX {o.total?.toLocaleString()}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        o.paymentStatus==='paid' ? 'bg-green-100 text-green-700' :
                        o.paymentStatus==='failed' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>{o.paymentStatus}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[o.orderStatus]||'bg-gray-100 text-gray-600'}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

// ─── CUSTOMERS ADMIN ──────────────────────────────────────────────────────────

function CustomersAdmin() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null);

  useEffect(() => {
    api.get("/admin/customers")
      .then(({ data }) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-2xl font-medium mb-1">Customers</h2>
          <p className="text-sm text-[#999]">{customers.length} registered customers</p>
        </div>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="Search by name, email or phone..."
               className="w-full max-w-sm px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({length:5}).map((_,i) => (
            <div key={i} className="h-14 bg-[#f5f2ed] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#999]">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium">{search ? "No customers match your search" : "No customers yet"}</p>
        </div>
      ) : (
        <div className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf7f2] text-left text-[11px] text-[#999] uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Phone</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Role</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Joined</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Shoe Size</th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f2ed]">
                {filtered.map(c => (
                  <tr key={c._id} className="hover:bg-[#faf7f2]/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                             style={{ background: "#2C5F2D" }}>
                          {c.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="font-medium text-[#141414]">{c.name}</div>
                          <div className="text-xs text-[#999]">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#5a5a5a] whitespace-nowrap">{c.phone || "—"}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        c.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : c.role === "guest"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-[#e8f2e8] text-[#2C5F2D]"
                      }`}>
                        {c.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#5a5a5a] whitespace-nowrap">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#5a5a5a] whitespace-nowrap">
                      {c.preferences?.shoeSize ? `EU ${c.preferences.shoeSize}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button onClick={() => setSelected(c)}
                              className="text-xs font-medium text-[#2C5F2D] hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
             style={{ background: "rgba(0,0,0,.45)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md"
               style={{ boxShadow: "0 24px 80px rgba(0,0,0,.18)" }}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                     style={{ background: "#2C5F2D" }}>
                  {selected.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-[#141414]">{selected.name}</div>
                  <div className="text-sm text-[#999]">{selected.email}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#aaa] hover:bg-[#f5f2ed] transition-colors">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Phone",     selected.phone || "—"],
                ["Role",      selected.role],
                ["Shoe Size", selected.preferences?.shoeSize ? `EU ${selected.preferences.shoeSize}` : "—"],
                ["Decor Style", selected.preferences?.decorStyle?.join(", ") || "—"],
                ["Addresses", `${selected.addresses?.length || 0} saved`],
                ["Joined",    selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-[#f5f2ed] last:border-0">
                  <span className="text-[#999]">{k}</span>
                  <span className="font-medium text-[#141414]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroEditorRoute() {
  const [Comp, setComp] = useState(null);
  const [err,  setErr]  = useState(false);
  useEffect(() => {
    import('./AdminHero')
      .then(m => setComp(() => m.default))
      .catch(() => setErr(true));
  }, []);
  if (err)  return <div className="text-sm text-[#e05252]">Failed to load hero editor. Check console.</div>;
  if (!Comp) return <div className="space-y-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-12 bg-[#f5f2ed] rounded-xl animate-pulse"/>)}</div>;
  return <Comp />;
}

// ─── COUPONS ADMIN Subsystem ──────────────────────────────────────────────────
function CouponsAdmin() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minCartAmount, setMinCartAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('23:59');
  const [error,        setError]        = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [expandedCode, setExpandedCode] = useState(null);   // which coupon row is expanded
  const [redemptions,  setRedemptions]  = useState({});     // { [code]: [...] }
  const [loadingRed,   setLoadingRed]   = useState(null);   // code currently loading

  const fetchCoupons = () => {
    setLoading(true);
    api.get('/admin/coupons')
      .then(({ data }) => {
        const couponList = Array.isArray(data) ? data : (data?.data || []);
        setCoupons(couponList);
      })
      .catch((err) => {
        console.error("Error fetching admin coupons:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchCoupons, []);

  const toggleRedemptions = async (code) => {
    if (expandedCode === code) { setExpandedCode(null); return; }
    setExpandedCode(code);
    if (redemptions[code]) return; // already loaded
    setLoadingRed(code);
    try {
      const { data } = await api.get(`/admin/coupons/${code}/redemptions`);
      setRedemptions(prev => ({ ...prev, [code]: data }));
    } catch {
      setRedemptions(prev => ({ ...prev, [code]: [] }));
    } finally {
      setLoadingRed(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!code || !discountValue) {
      setError('Coupon code and discount value are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Combine date and time into a single ISO timestamp so the coupon
      // expires at the exact minute the admin intends, not just midnight.
      const expiresAt = expiryDate
        ? new Date(`${expiryDate}T${expiryTime || '23:59'}:00`).toISOString()
        : null;

      await api.post('/admin/coupons', {
        code,
        discountType,
        discountValue,
        minSubtotalRequired: minCartAmount,
        expiresAt,
      });

      setCode('');
      setDiscountValue('');
      setMinCartAmount('');
      setExpiryDate('');
      setExpiryTime('23:59');
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create coupon rule.');
    } finally {
      setSubmitting(false);
    }
  };

  // FIXED: Accepts ID or alphanumeric code dynamically
  const handleToggleStatus = async (targetIdentifier, currentStatus) => {
    if (!targetIdentifier) return;
    try {
      await api.patch(`/admin/coupons/${targetIdentifier}/status`, { isActive: !currentStatus });
      fetchCoupons();
    } catch (err) {
      console.error("Error updating coupon status:", err);
    }
  };

  // FIXED: Accepts ID or alphanumeric code dynamically
  const handleDelete = async (targetIdentifier) => {
    if (!targetIdentifier) return;
    if (!window.confirm('Are you sure you want to completely remove this coupon rule?')) return;
    try {
      await api.delete(`/admin/coupons/${targetIdentifier}`);
      fetchCoupons();
    } catch (err) {
      console.error("Error deleting coupon:", err);
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors bg-white";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1";

  return (
    <div>
      <h2 className="font-semibold text-2xl mb-6 text-[#141414]">Coupon Promo Codes</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 h-fit">
          <h3 className="font-semibold text-base mb-4 text-[#141414]">Generate Coupon</h3>
          
          {error && (
            <div className="rounded-xl p-3 text-sm bg-[#fef2f2] text-[#e05252] border border-[#fecaca] mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className={labelCls}>Coupon Code *</label>
              <input 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value)}
                placeholder="E.g., SAVE20" 
                className={inputCls} 
              />
            </div>

            <div>
              <label className={labelCls}>Discount Type</label>
              <select 
                value={discountType} 
                onChange={e => setDiscountType(e.target.value)} 
                className={inputCls}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (UGX)</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Discount Value *</label>
              <input 
                type="number" 
                value={discountValue} 
                onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? "20" : "15000"} 
                className={inputCls} 
              />
            </div>

            <div>
              <label className={labelCls}>Minimum Order (UGX)</label>
              <input 
                type="number" 
                value={minCartAmount} 
                onChange={e => setMinCartAmount(e.target.value)}
                placeholder="0" 
                className={inputCls} 
              />
            </div>

            <div>
              <label className={labelCls}>Expiry Date &amp; Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className={inputCls}
                  style={{ flex: 2 }}
                />
                <input
                  type="time"
                  value={expiryTime}
                  onChange={e => setExpiryTime(e.target.value)}
                  className={inputCls}
                  style={{ flex: 1 }}
                />
              </div>
              {expiryDate && (
                <p className="text-[10px] mt-1" style={{ color:'var(--ink-soft,#999)' }}>
                  Expires: {new Date(`${expiryDate}T${expiryTime || '23:59'}:00`).toLocaleString('en-UG', { dateStyle:'medium', timeStyle:'short' })}
                </p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full py-2.5 rounded-full text-xs font-semibold text-white transition-all disabled:opacity-60 mt-2" 
              style={{ background: '#2C5F2D' }}
            >
              {submitting ? 'Generating Rule...' : 'Deploy Coupon Rule'}
            </button>
          </form>
        </div>

        {/* Ledger List */}
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-5 overflow-hidden lg:col-span-2">
          <h3 className="font-semibold text-base mb-4 text-[#141414]">Active Coupos</h3>
          
          {loading ? (
            <div className="py-8 text-center text-sm text-[#999]">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#999]">No deployed active promo codes found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[11px] text-[#999] uppercase tracking-wide border-b border-[#f5f2ed]">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Discount</th>
                    <th className="pb-3 font-medium">Min Order</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f2ed]">
                  {coupons.map((coupon, idx) => {
                    // FIXED: Generate safe unique identifiers using document references or raw code keys
                    const targetIdentifier = coupon.id || coupon._id || coupon.code;
                    const rowKey = targetIdentifier || `idx-${idx}`;
                    const isRowActive = coupon.isActive !== false && coupon.status !== 'inactive';

                    return (
                      <tr key={rowKey} className="hover:bg-[#faf7f2]/50 transition-colors">
                        <td className="py-3.5 font-semibold text-[#141414] tracking-wider">
                          {coupon.code}
                        </td>
                        <td className="py-3.5 text-[#5a5a5a]">
                          {coupon.discountType === 'percentage' || coupon.type === 'percentage' 
                            ? `${coupon.discountValue || coupon.value}% Off` 
                            : `UGX ${(coupon.discountValue || coupon.value || 0).toLocaleString()}`}
                        </td>
                        <td className="py-3.5 text-[#5a5a5a]">
                          UGX {(coupon.minSubtotalRequired || coupon.minTotal || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isRowActive 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-gray-50 text-gray-500 border border-gray-200'
                          }`}>
                            {isRowActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-3">
                          <button
                            onClick={() => toggleRedemptions(coupon.code)}
                            className="text-xs text-[#5a7ab0] hover:underline font-medium"
                          >
                            {expandedCode === coupon.code ? 'Hide' : 'History'}
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(targetIdentifier, isRowActive)}
                            className="text-xs text-[#2C5F2D] hover:underline font-medium"
                          >
                            Toggle
                          </button>
                          <button 
                            onClick={() => handleDelete(targetIdentifier)}
                            className="text-xs text-[#e05252] hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )

                      {/* Expandable redemption history */}
                      {expandedCode === coupon.code && (
                        <tr key={`${rowKey}-history`}>
                          <td colSpan={5} className="pb-4 px-0">
                            <div className="mx-0 rounded-xl border p-4" style={{ background:'#f8faf8', borderColor:'#c8e6c9' }}>
                              <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color:'#2C5F2D' }}>
                                📋 Redemption History — {coupon.code}
                              </div>
                              {loadingRed === coupon.code ? (
                                <div className="text-xs text-[#999] py-2">Loading...</div>
                              ) : !redemptions[coupon.code]?.length ? (
                                <div className="text-xs text-[#999] py-2">No redemptions yet for this coupon.</div>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[10px] text-[#999] uppercase tracking-wide border-b border-[#e8f5e9]">
                                      <th className="pb-2 font-medium text-left">Order</th>
                                      <th className="pb-2 font-medium text-left">Customer</th>
                                      <th className="pb-2 font-medium text-left">Type</th>
                                      <th className="pb-2 font-medium text-left">Discount</th>
                                      <th className="pb-2 font-medium text-left">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#f1f8f1]">
                                    {redemptions[coupon.code].map((r, i) => (
                                      <tr key={i} className="hover:bg-[#f1f8f1]">
                                        <td className="py-2 font-medium text-[#2C5F2D]">{r.orderNumber || '—'}</td>
                                        <td className="py-2 text-[#5a5a5a]">{r.customerPhone || r.customerId?.slice(0,8) || '—'}</td>
                                        <td className="py-2">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${r.customerType === 'guest' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {r.customerType || 'unknown'}
                                          </span>
                                        </td>
                                        <td className="py-2 font-semibold" style={{ color:'#1e805f' }}>
                                          UGX {Number(r.discountAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="py-2 text-[#999]">
                                          {r.redeemedAt ? new Date(r.redeemedAt).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    ;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN LAYOUT ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/admin',           icon: '📊', label: 'Dashboard' },
  { to: '/admin/products',  icon: '🛍️', label: 'Products'  },
  { to: '/admin/orders',    icon: '📦', label: 'Orders'    },
  { to: '/admin/coupons',   icon: '🎫', label: 'Coupons'   },
  { to: '/admin/customers', icon: '👥', label: 'Customers' },
  { to: '/admin/hero',      icon: '🖼️', label: 'Hero' },
  { to: '/admin/settings',  icon: '⚙️', label: 'Settings' },
];

export default function Admin() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { logout }   = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  // Close mobile sidebar on navigation switch
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: '#faf7f2' }}>
      
      {/* Mobile Header Bar */}
      <div className="flex md:hidden items-center justify-between bg-white border-b border-[#ede9e2] px-4 py-3 sticky top-0 z-40">
        <div>
          <span className="font-semibold italic text-lg font-medium text-[#2C5F2D]">Essentials256</span>
          <span className="text-[9px] tracking-wider uppercase ml-2 text-[#b8973a]">Admin</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-[#ede9e2] text-sm text-[#5a5a5a] hover:bg-[#faf7f2]">
          {mobileMenuOpen ? '✕ Close' : '☰ Menu'}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-[49px] md:top-0 left-0 bottom-0 z-30
        w-56 bg-white border-r border-[#ede9e2] flex flex-col flex-shrink-0
        transition-transform duration-200 transform
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 border-b border-[#ede9e2] hidden md:block">
          <div className="font-semibold text-[20px] leading-none">
                  <span style={{ color: '#746e6ee1' }}>essentials</span>
                         <span style={{ color: 'var(--teal)' }}>256</span>
                       </div>
          <div className="text-[10px] tracking-[2px] uppercase mt-0.5" style={{ color: '#b8973a' }}>
            Admin Panel
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.to || (item.to !== '/admin' && pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                      active
                        ? 'bg-[#e8f2e8] text-[#2C5F2D] font-medium'
                        : 'text-[#5a5a5a] hover:bg-[#f5f2ed] hover:text-[#141414]'
                    }`}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#ede9e2] space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#999] hover:bg-[#f5f2ed] transition-colors">
            ← Back to Store
          </Link>
          <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#e05252] hover:bg-[#fef2f2] transition-colors">
            → Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop for overlay sidebar on mobile viewports */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/20 z-20 md:hidden" 
          style={{ top: '49px' }}
        />
      )}

      {/* Main content canvas */}
      <main className="flex-1 p-4 md:p-8 overflow-auto w-full max-w-full">
        <Routes>
          <Route index           element={<DashboardHome />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="orders"   element={<OrdersAdmin />} />
          <Route path="coupons"  element={<CouponsAdmin />} />
          <Route path="customers" element={<CustomersAdmin />} />
          <Route path="hero" element={<HeroEditorRoute />} />
          <Route path="settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
}