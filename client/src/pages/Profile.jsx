import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore, useWishlistStore } from '../stores';
import { orderService, authService } from '../services/api';
import { DELIVERY_ZONES } from '../utils/deliveryZones';

const fmt = n => `UGX ${n?.toLocaleString()}`;
const toTitleCase = s => s.replace(/\b\w/g, c => c.toUpperCase());

const STATUS_COLOR = {
  delivered:  'bg-green-100 text-green-700',
  shipped:    'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  pending:    'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-100 text-red-600',
};

export default function Profile() {
  const { user, logout, refreshUser } = useAuthStore();
  const { items: wishlist, toggle }   = useWishlistStore();
  const [params, setParams]      = useSearchParams();
  const [activeTab, setActiveTab]= useState(params.get('tab') || 'account');
  const [orders,    setOrders]   = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Account form: controlled, so there's something real to save ──────────
  const [accountForm, setAccountForm] = useState({
    name:     user?.name  || '',
    phone:    user?.phone || '',
    shoeSize: user?.preferences?.shoeSize || '',
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg,    setAccountMsg]    = useState('');
  const [accountError,  setAccountError]  = useState('');

  // Keep the form in sync if `user` loads/changes after this component mounts
  // (e.g. on first load before refreshUser() resolves).
  useEffect(() => {
    setAccountForm({
      name:     user?.name  || '',
      phone:    user?.phone || '',
      shoeSize: user?.preferences?.shoeSize || '',
    });
  }, [user?.name, user?.phone, user?.preferences?.shoeSize]);

  // ── Addresses: Add New Address form state ─────────────────────────────────
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressSaving,  setAddressSaving]  = useState(false);
  const [addressError,   setAddressError]   = useState('');
  const [newAddress, setNewAddress] = useState({
    type: 'Home', street: '', region: '', town: '', isDefault: false,
  });

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

  const saveAccount = async () => {
    setAccountSaving(true);
    setAccountError('');
    try {
      await authService.updateProfile({
        name:  accountForm.name,
        phone: accountForm.phone,
        preferences: { ...user?.preferences, shoeSize: accountForm.shoeSize || null },
      });
      await refreshUser(); // pulls the saved copy back down so the UI reflects what's actually stored
      setAccountMsg('Changes saved!');
      setTimeout(() => setAccountMsg(''), 2500);
    } catch (err) {
      setAccountError(err.response?.data?.message || 'Could not save changes. Please try again.');
    } finally {
      setAccountSaving(false);
    }
  };

  const saveNewAddress = async () => {
    setAddressError('');
    if (!newAddress.street.trim()) return setAddressError('Please enter a street/address line.');
    if (!newAddress.region || !newAddress.town) return setAddressError('Please select a region and town.');

    setAddressSaving(true);
    try {
      const nextAddresses = [
        ...(user?.addresses || []).map(a =>
          newAddress.isDefault ? { ...a, isDefault: false } : a
        ),
        {
          type:      newAddress.type,
          street:    newAddress.street.trim(),
          city:      newAddress.town,      // matches shippingAddress.city shape used at checkout
          district:  '',
          country:   'Uganda',
          isDefault: newAddress.isDefault || (user?.addresses?.length || 0) === 0,
        },
      ];
      await authService.updateProfile({ addresses: nextAddresses });
      await refreshUser();
      setNewAddress({ type: 'Home', street: '', region: '', town: '', isDefault: false });
      setShowAddAddress(false);
    } catch (err) {
      setAddressError(err.response?.data?.message || 'Could not save this address. Please try again.');
    } finally {
      setAddressSaving(false);
    }
  };

  const removeAddress = async (index) => {
    const nextAddresses = (user?.addresses || []).filter((_, i) => i !== index);
    try {
      await authService.updateProfile({ addresses: nextAddresses });
      await refreshUser();
    } catch {
      // Silent — worst case the list just doesn't update until next refresh;
      // not worth a modal for a delete that can simply be retried.
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
             style={{ background: '#2C5F2D' }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="font-semibold text-2xl font-medium">{user?.name}</h1>
          <p className="text-sm text-[#999]">{user?.email}</p>
        </div>
        <button onClick={async () => { await logout(); }}
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
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">Full Name</label>
              <input type="text" value={accountForm.name}
                     onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))}
                     className="w-full px-4 py-3 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">Email</label>
              <input type="email" value={user?.email || ''} disabled
                     className="w-full px-4 py-3 border border-[#ede9e2] rounded-xl text-sm outline-none bg-[#faf7f2] text-[#999] cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">Phone</label>
              <input type="tel" value={accountForm.phone}
                     onChange={e => setAccountForm(f => ({ ...f, phone: e.target.value }))}
                     className="w-full px-4 py-3 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">
                Preferred Shoe Size (EU)
              </label>
              <select value={accountForm.shoeSize}
                      onChange={e => setAccountForm(f => ({ ...f, shoeSize: e.target.value }))}
                      className="w-full px-4 py-3 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors">
                <option value="">Not set</option>
                {[35,36,37,38,39,40,41,42].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {accountError && <p className="text-xs" style={{ color: '#e05252' }}>{accountError}</p>}

            <button onClick={saveAccount} disabled={accountSaving}
                    className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ background: '#2C5F2D' }}>
              {accountSaving ? 'Saving…' : (accountMsg || 'Save Changes')}
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
            <div key={i} className="bg-white border border-[#ede9e2] rounded-2xl p-5 relative">
              <button onClick={() => removeAddress(i)}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full text-[#999] hover:text-[#e05252] hover:bg-[#fef2f2] flex items-center justify-center text-xs transition-colors"
                      title="Remove address">
                ✕
              </button>
              <div className="flex justify-between mb-2 pr-8">
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
          )) : !showAddAddress && (
            <div className="col-span-2 text-center py-10">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-sm text-[#999]">No saved addresses yet</p>
            </div>
          )}

          {showAddAddress ? (
            <div className="col-span-2 md:col-span-1 bg-white border border-[#ede9e2] rounded-2xl p-5 space-y-3">
              <h4 className="font-semibold text-sm mb-1">New Address</h4>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">Label</label>
                <select value={newAddress.type}
                        onChange={e => setNewAddress(a => ({ ...a, type: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D]">
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">Street / Address line</label>
                <input type="text" value={newAddress.street}
                       placeholder="e.g. Plot 12, Acacia Road"
                       onChange={e => setNewAddress(a => ({ ...a, street: e.target.value }))}
                       className="w-full px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D]" />
              </div>

              {/* Same two-level region/town dropdown as checkout, so every
                  saved address resolves to a real, priceable delivery zone
                  rather than a free-text city that might not match anything. */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">Region</label>
                <select value={newAddress.region}
                        onChange={e => setNewAddress(a => ({ ...a, region: e.target.value, town: '' }))}
                        className="w-full px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D]">
                  <option value="">Select region…</option>
                  {Object.entries(DELIVERY_ZONES).map(([key, zone]) => (
                    <option key={key} value={key}>{zone.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1.5">Town</label>
                <select value={newAddress.town}
                        onChange={e => setNewAddress(a => ({ ...a, town: e.target.value }))}
                        disabled={!newAddress.region}
                        className="w-full px-4 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] disabled:bg-[#faf7f2] disabled:text-[#999]">
                  <option value="">{newAddress.region ? 'Select town…' : 'Pick region first'}</option>
                  {newAddress.region && Object.keys(DELIVERY_ZONES[newAddress.region].areas)
                    .sort((a, b) => a.localeCompare(b))
                    .map(area => (
                      <option key={area} value={area}>{toTitleCase(area)}</option>
                    ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#5a5a5a]">
                <input type="checkbox" checked={newAddress.isDefault}
                       onChange={e => setNewAddress(a => ({ ...a, isDefault: e.target.checked }))} />
                Set as default address
              </label>

              {addressError && <p className="text-xs" style={{ color: '#e05252' }}>{addressError}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={saveNewAddress} disabled={addressSaving}
                        className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                        style={{ background: '#2C5F2D' }}>
                  {addressSaving ? 'Saving…' : 'Save Address'}
                </button>
                <button onClick={() => { setShowAddAddress(false); setAddressError(''); }}
                        className="rounded-full px-4 py-2.5 text-sm border border-[#ede9e2] text-[#5a5a5a] hover:bg-[#faf7f2] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddAddress(true)}
                    className="border-2 border-dashed border-[#ede9e2] rounded-2xl p-5 text-center text-sm text-[#999] hover:border-[#2C5F2D] hover:text-[#2C5F2D] transition-colors">
              + Add New Address
            </button>
          )}
        </div>
      )}
    </div>
  );
}
