import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// ─── SHARED API INSTANCE ──────────────────────────────────────────────────────
export const api = axios.create({
  // Point directly to your production Firebase URL
  baseURL: 'https://essentials-256.web.app/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  try {
    const raw   = localStorage.getItem('essentials256-auth');
    const token = raw ? JSON.parse(raw)?.state?.token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

const PUBLIC = ['/orders/guest', '/payments/pesapal', '/auth/login', '/auth/register', '/products'];
api.interceptors.response.use(
  res => res,
  err => {
    const url      = err.config?.url || '';
    const isPublic = PUBLIC.some(p => url.includes(p));
    if (err.response?.status === 401 && !isPublic) {
      localStorage.removeItem('essentials256-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH STORE ───────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, token: null, loading: false, error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.user, token: data.token, loading: false, error: null });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      register: async (name, email, password, phone) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', { name, email, password, phone });
          set({ user: data.user, token: data.token, loading: false, error: null });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed';
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      logout: async () => {
        // Call the server first so tokenVersion is incremented and the JWT
        // is invalidated immediately — then clear local state regardless of
        // whether the server call succeeded (e.g. already expired token).
        try {
          await api.post('/auth/logout');
        } catch {
          // Swallow — token may already be expired or revoked; local
          // clear still needs to happen either way.
        }
        set({ user: null, token: null, error: null });
      },
      isLoggedIn:  () => !!get().token,
      isAdmin:     () => get().user?.role === 'admin',

      refreshUser: async () => {
        if (!get().token) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
        } catch {
          set({ user: null, token: null });
        }
      },
    }),
    { name: 'essentials256-auth', partialize: s => ({ token: s.token, user: s.user }) }
  )
);

// ─── CART STORE — no shipping, total = subtotal ───────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items:    [],
      isOpen:   false,
      count:    0,
      subtotal: 0,
      total:    0,

      _recalc: (items) => {
        const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
        const count    = items.reduce((s, i) => s + i.qty, 0);
        return { items, subtotal, total: subtotal, count };
      },

      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      toggleCart: () => set(s => ({ isOpen: !s.isOpen })),

      addItem: (product, { size, color, qty = 1 } = {}) => {
        const key      = `${product._id || product.id}-${size || ''}-${color || ''}`;
        const existing = get().items.find(i => i.key === key);
        const next     = existing
          ? get().items.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i)
          : [...get().items, { key, product, size, color, qty }];
        // Auto-open cart drawer on every add
        set({ ...get()._recalc(next), isOpen: true });
      },

      removeItem: (key) => set(get()._recalc(get().items.filter(i => i.key !== key))),

      updateQty: (key, qty) => {
        if (qty <= 0) { get().removeItem(key); return; }
        set(get()._recalc(get().items.map(i => i.key === key ? { ...i, qty } : i)));
      },

      clearCart: () => set({ items: [], count: 0, subtotal: 0, total: 0 }),
    }),
    {
      name: 'essentials256-cart',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const subtotal = state.items.reduce((s, i) => s + i.product.price * i.qty, 0);
          const count    = state.items.reduce((s, i) => s + i.qty, 0);
          state.subtotal = subtotal;
          state.total    = subtotal;
          state.count    = count;
        }
      },
    }
  )
);

// ─── WISHLIST STORE ───────────────────────────────────────────────────────────
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        const id     = product._id || product.id;
        const exists = get().items.some(i => (i._id || i.id) === id);
        set(s => ({
          items: exists
            ? s.items.filter(i => (i._id || i.id) !== id)
            : [...s.items, product],
        }));
        return !exists;
      },
      isWished: (id) => get().items.some(i => (i._id || i.id) === id),
    }),
    { name: 'essentials256-wishlist' }
  )
);
