// Re-export the shared api instance created in stores/index.js
// This ensures all service calls use the same axios instance with the auth interceptor
export { api as default } from '../stores';

import { api } from '../stores';

// ─── PRODUCT ENDPOINTS ────────────────────────────────────────────────────────
export const productService = {
  list:      (params) => api.get('/products', { params }),
  getBySlug: (slug)   => api.get(`/products/${slug}`),
  create:    (data)   => api.post('/products', data),
  update:    (id, d)  => api.patch(`/products/${id}`, d),
  delete:    (id)     => api.delete(`/products/${id}`),
};

// ─── ORDER ENDPOINTS ──────────────────────────────────────────────────────────
export const orderService = {
  create:       (data) => api.post('/orders', data),
  createGuest:  (data) => api.post('/orders/guest', data),
  getMyOrders:  ()     => api.get('/orders/my'),
  getByNumber:  (num, phone = '') => 
    api.get(`/orders/${num}${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
};

// ─── COUPON ENDPOINTS ─────────────────────────────────────────────────────────
export const couponService = {
  validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }),
  list:     ()               => api.get('/admin/coupons'),
  create:   (data)           => api.post('/admin/coupons', data),
  delete:   (id)             => api.delete(`/admin/coupons/${id}`),
};

// ─── PAYMENT ENDPOINTS ────────────────────────────────────────────────────────
export const paymentService = {
  initiate:    (orderId)     => api.post('/payments/pesapal/initiate', { orderId }),
  checkStatus: (orderNumber) => api.get(`/payments/pesapal/status/${orderNumber}`),
};

// ─── AUTH ENDPOINTS ───────────────────────────────────────────────────────────
export const authService = {
  login:          (data)            => api.post('/auth/login', data),
  register:       (data)            => api.post('/auth/register', data),
  me:             ()                => api.get('/auth/me'),
  updateProfile:  (data)            => api.patch('/auth/profile', data),
  forgotPassword: (email)           => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  confirmEmailChange: (token)       => api.post(`/auth/confirm-email-change/${token}`),
};
