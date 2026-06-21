const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  type:      { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  street:    { type: String, required: true },
  city:      { type: String, required: true },
  district:  { type: String },
  country:   { type: String, required: true, default: 'Uganda' },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  phone:        { type: String },
  googleId:     { type: String },
  avatar:       { type: String },
  role:         { type: String, enum: ['customer', 'admin','guest'], default: 'customer' },
  addresses:    [addressSchema],
  preferences: {
    shoeSize:        { type: Number },
    widthPreference: { type: String, enum: ['narrow', 'regular', 'wide'] },
    decorStyle:      [{ type: String }],
  },
  wishlist:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isVerified:   { type: Boolean, default: false },
  verifyToken:  { type: String },
  resetToken:   { type: String },
  resetExpires: { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.verifyToken;
  delete obj.resetToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
