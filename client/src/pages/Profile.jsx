import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore, useWishlistStore } from '../stores';
import { orderService } from '../services/api';

const fmt = n => `UGX ${n?.toLocaleString()}`;

const STATUS_COLOR = {
  delivered:  'bg-green-100 text-green-700',
  shipped:    'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  pending:    'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-100 text-red-600',
};

export default function Profile() {
  const { user, logout }         = useAuthStore();
  const { items: wishlist, toggle } = useWishlistStore();
  const [params, setParams]      = useSearchParams();
  const [activeTab, setActiveTab]= useState(params.get('tab') || 'account');
  const [orders,    setOrders]   = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saveMsg,  setSaveMsg]   = useState('');

  useEffect(() => {
    if (activeTab === 'orders') {
      setOrdersLoading(true);
      orderService.getMyOrders()
        .then(({ data }) => setOrders(data))
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab]);

  const switchTab = (id) => {
    setActiveTab(id);
    setParams({ tab: id });
  };

  const tabs = [
    { id: 'account',   label: '👤 Account'   },
    { id: 'orders',    label: '📦 My Orders'  },
    { id: 'wishlist',  label: `♡ Wishlist${wishlist.length ? ` (${wishlist.length})` : ''}` },
    { id: 'addresses', label: '📍 Addresses'  },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
             style={{ background: '#2C5F2D' }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="font-serif text-2xl font-medium">{user?.name}</h1>
          <p className="text-sm text-[#999]">{user?.email}</p>
        </div>
        <button onClick={logout}
                className="ml-auto text-sm border rounded-full px-4 py-2 transition-colors hover:bg-[#fef2f2]"
                style={{ color: '#e05252', borderColor: '#fecaca' }}>
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#ede9e2] mb-6 gap-0 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => switchTab(tab.id)}
                  className={`px-5 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#2C5F2D] text-[#2C5F2D] font-medium'
                      : 'border-transparent text-[#999] hover:text-[#5a5a5a]'
                  }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ACCOUNT ── */}
      {activeTab === 'account' && (
        <div className="bg-white border border-[#ede9e2] rounded-2xl p-6 max-w-lg">
          <h3 className="font-semibold mb-5">Personal Information</h3>
          <div className="space-y-4">
            {[
              { label: 'Full Name',  value: user?.name,  type: 'text'  },
              { label: 'Email',      value: user?.email, type: 'email' },
              { label: 'Phone',      value: user?.phone, type: 'tel'   },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">
                  {f.label}
                </label>
                <input type={f.type} defaultValue={f.value || ''}
                       className="w-full px-4 py-3 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors" />
              </div>
            ))}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">
                Preferred Shoe Size (EU)
              </label>
              <select defaultValue={user?.preferences?.shoeSize || ''}
                      className="w-full px-4 py-3 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors">
                <option value="">Not set</option>
                {[35,36,37,38,39,40,41,42].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={() => { setSaveMsg('Changes saved!'); setTimeout(() => setSaveMsg(''), 2500); }}
                    className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
                    style={{ background: '#2C5F2D' }}>
              {saveMsg || 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── ORDERS ── */}
      {activeTab === 'orders' && (
        <div>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#f5f2ed' }} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📦</div>
              <p className="font-medium text-[#141414] mb-1">No orders yet</p>
              <p className="text-sm text-[#999] mb-5">Your order history will appear here</p>
              <Link to="/" className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white"
                    style={{ background: '#2C5F2D' }}>
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order._id} className="bg-white border border-[#ede9e2] rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: '#2C5F2D' }}>
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-[#999] mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {order.orderStatus}
                      </span>
                      <div className="text-sm font-bold text-[#141414] mt-1.5">{fmt(order.total)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                           style={{ background: '#faf7f2' }}>
                        <span className="font-medium text-[#141414]">{item.name}</span>
                        {item.size && <span className="text-[#999]">EU {item.size}</span>}
                        <span className="text-[#999]">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WISHLIST ── */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">♡</div>
              <p className="font-medium text-[#141414] mb-1">Your wishlist is empty</p>
              <p className="text-sm text-[#999] mb-5">Heart items you love while browsing</p>
              <Link to="/" className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white"
                    style={{ background: '#2C5F2D' }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#999] mb-5">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlist.map(product => {
                  const id    = product._id || product.id;
                  const price = product.price;
                  const img   = product.images?.[0];
                  return (
                    <div key={id} className="bg-white border border-[#ede9e2] rounded-2xl overflow-hidden group">
                      <Link to={`/products/${product.slug}`}>
                        <div className="h-44 overflow-hidden relative" style={{ background: '#f5f2ed' }}>
                          {img
                            ? <img src={img} alt={product.name}
                                   className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            : <div className="w-full h-full flex items-center justify-center text-5xl">
                                {product.type === 'footwear' ? '👠' : '🏺'}
                              </div>
                          }
                        </div>
                        <div className="p-3">
                          <div className="text-xs text-[#999] mb-0.5">{product.category}</div>
                          <div className="text-sm font-medium text-[#141414] line-clamp-1 mb-1">{product.name}</div>
                          <div className="text-sm font-bold" style={{ color: '#2C5F2D' }}>{fmt(price)}</div>
                        </div>
                      </Link>
                      <div className="px-3 pb-3 flex gap-2">
                        <Link to={`/products/${product.slug}`}
                              className="flex-1 text-center text-xs font-semibold py-2 rounded-full text-white transition-colors"
                              style={{ background: '#2C5F2D' }}>
                          View Item
                        </Link>
                        <button onClick={() => toggle(product)}
                                className="w-8 h-8 rounded-full border border-[#ede9e2] flex items-center justify-center text-[#e05252] hover:bg-[#fef2f2] transition-colors text-sm">
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADDRESSES ── */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.addresses?.length ? user.addresses.map((addr, i) => (
            <div key={i} className="bg-white border border-[#ede9e2] rounded-2xl p-5">
              <div className="flex justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#999]">{addr.type}</span>
                {addr.isDefault && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: '#e8f2e8', color: '#2C5F2D' }}>Default</span>
                )}
              </div>
              <p className="text-sm text-[#141414]">{addr.street}</p>
              <p className="text-sm text-[#5a5a5a]">{addr.city}{addr.district ? `, ${addr.district}` : ''}</p>
              <p className="text-sm text-[#5a5a5a]">{addr.country}</p>
            </div>
          )) : (
            <div className="col-span-2 text-center py-10">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-sm text-[#999]">No saved addresses yet</p>
            </div>
          )}
          <button className="border-2 border-dashed border-[#ede9e2] rounded-2xl p-5 text-center text-sm text-[#999] hover:border-[#2C5F2D] hover:text-[#2C5F2D] transition-colors">
            + Add New Address
          </button>
        </div>
      )}
    </div>
  );
}
