const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku:       { type: String, required: true },
  name:      { type: String, required: true },
  image:     { type: String },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  size:      { type: Number },
  width:     { type: String },
  color:     { type: String },
});

const addressSchema = new mongoose.Schema({
  name:     { type: String },
  phone:    { type: String },
  street:   { type: String, required: true },
  city:     { type: String, required: true },
  district: { type: String },
  country:  { type: String, required: true },
});

const orderSchema = new mongoose.Schema({
  orderNumber:           { type: String, unique: true },
  // customerId is optional — guests don't have accounts
  customerId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Guest contact info stored directly on order for tracking
  guestInfo: {
    name:  { type: String },
    email: { type: String },
    phone: { type: String },
  },
  items:                 [orderItemSchema],
  subtotal:              { type: Number, required: true },
  shippingFee:           { type: Number, default: 0 },
  discount:              { type: Number, default: 0 },
  tax:                   { type: Number, default: 0 },
  total:                 { type: Number, required: true },
  shippingAddress:       addressSchema,
  billingAddress:        addressSchema,
  paymentMethod:         { type: String, default: 'pesapal' },
  paymentStatus:         { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  pesapalOrderId:        { type: String },
  pesapalTrackingId:     { type: String },
  pesapalMerchantRef:    { type: String },
  orderStatus:           { type: String, enum: ['pending','processing','shipped','delivered','cancelled','returned'], default: 'pending' },
  trackingNumber:        { type: String },
  deliveryEstimate:      { type: Date },
  deliveryMethod:        { type: String, enum: ['standard','express'], default: 'standard' },
  couponCode:            { type: String },
  giftWrapping:          { type: Boolean, default: false },
  giftMessage:           { type: String },
  notes:                 { type: String },
  statusHistory:         [{ status: String, note: String, updatedAt: { type: Date, default: Date.now } }],
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `E256-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
