const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku:              { type: String, required: true, unique: true },
  type:             { type: String, enum: ['footwear', 'decor'], required: true },
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true }, // unique: true already creates an index
  description:      { type: String, required: true },
  shortDescription: { type: String },
  price:            { type: Number, required: true, min: 0 },
  compareAtPrice:   { type: Number, default: 0 },
  images:           [{ type: String }],
  videos:           [{ type: String }],
  category:         { type: String, required: true },
  subcategory:      { type: String },
  tags:             [{ type: String }],
  stock:            { type: Number, default: 0, min: 0 },
  status:           { type: String, enum: ['active', 'draft', 'out_of_stock'], default: 'active' },
  featured:         { type: Boolean, default: false },
  rating:           { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:      { type: Number, default: 0 },

  // Footwear-specific
  footwearDetails: {
    sizes:            [{ type: Number }],
    halfSizes:        [{ type: Number }],
    widths:           [{ type: String, enum: ['narrow', 'regular', 'wide'] }],
    heelHeight:       { type: Number },
    material:         { type: String },
    lining:           { type: String },
    sole:             { type: String },
    closure:          [{ type: String, enum: ['lace-up', 'buckle', 'zip', 'slip-on'] }],
    occasion:         [{ type: String }],
    careInstructions: { type: String },
  },

  // Decor-specific
  decorDetails: {
    dimensions: {
      height: { type: Number },
      width:  { type: Number },
      depth:  { type: Number },
    },
    weight:           { type: Number },
    material:         { type: String },
    color:            { type: String },
    colorFamily:      { type: String },
    room:             [{ type: String }],
    style:            [{ type: String }],
    assembly:         { type: Boolean, default: false },
    careInstructions: { type: String },
    indoorOutdoor:    { type: String, enum: ['indoor', 'outdoor', 'both'], default: 'indoor' },
  },
}, { timestamps: true });

// Only index fields that don't already have unique:true in the schema definition above.
// slug and sku already have implicit indexes from unique:true — do NOT add them here again.
productSchema.index({ type: 1, status: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
