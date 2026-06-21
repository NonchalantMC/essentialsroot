const mongoose = require('mongoose');

// ─── REVIEW ────────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  productId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:          { type: Number, required: true, min: 1, max: 5 },
  title:           { type: String, required: true },
  comment:         { type: String, required: true },
  images:          [{ type: String }],
  verifiedPurchase:{ type: Boolean, default: false },
  // Footwear-specific
  fitFeedback:     { type: String, enum: ['true_to_size', 'runs_small', 'runs_large'] },
  comfortRating:   { type: Number, min: 1, max: 5 },
  // Decor-specific
  colorAccuracy:   { type: Boolean },
  qualityRating:   { type: Number, min: 1, max: 5 },
  helpfulCount:    { type: Number, default: 0 },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
}, { timestamps: true });

reviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });

// ─── CART ──────────────────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku:       { type: String },
  name:      { type: String },
  image:     { type: String },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  size:      { type: Number },
  width:     { type: String },
  color:     { type: String },
});

const cartSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId:  { type: String }, // for guest users
  items:      [cartItemSchema],
  expiresAt:  { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
}, { timestamps: true });

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── COUPON ────────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true },
  description:    { type: String },
  discountType:   { type: String, enum: ['percentage', 'fixed'], required: true },
  value:          { type: Number, required: true },
  minPurchase:    { type: Number, default: 0 },
  maxDiscount:    { type: Number }, // cap for percentage discounts
  validFrom:      { type: Date, required: true },
  validTo:        { type: Date, required: true },
  usageLimit:     { type: Number, default: null }, // null = unlimited
  usageCount:     { type: Number, default: 0 },
  perUserLimit:   { type: Number, default: 1 },
  applicableTo:   { type: String, enum: ['all', 'footwear', 'decor'], default: 'all' },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

module.exports = {
  Review: mongoose.model('Review', reviewSchema),
  Cart:   mongoose.model('Cart',   cartSchema),
  Coupon: mongoose.model('Coupon', couponSchema),
};
