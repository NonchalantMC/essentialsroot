const mongoose = require('mongoose');

const heroImageSchema = new mongoose.Schema({
  url:   { type: String, required: true },
  name:  { type: String, default: '' },
  price: { type: String, default: '' },
  link:  { type: String, default: '/' },
});

const heroConfigSchema = new mongoose.Schema({
  // Only one document ever exists — use singleton pattern
  singleton: { type: String, default: 'hero', unique: true },

  eyebrow:  { type: String, default: 'New Season Arrivals' },
  heading:  { type: String, default: 'Where Style Meets Your Space' },
  subheading:{ type: String, default: 'Your Essentials for a Perfect Home & Lifestyle' },
  ctaPrimary:  { label: { type: String, default: 'Shop Footwear' }, link: { type: String, default: '/footwear' } },
  ctaSecondary:{ label: { type: String, default: 'Explore Decor'  }, link: { type: String, default: '/decor'    } },

  stat1: { value: { type: String, default: '500+' }, label: { type: String, default: 'Products'   } },
  stat2: { value: { type: String, default: '4.8★' }, label: { type: String, default: 'Avg Rating' } },
  stat3: { value: { type: String, default: '1K+'  }, label: { type: String, default: 'Customers'  } },

  images: { type: [heroImageSchema], default: [
    { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&q=85&fit=crop', name: 'Classic Pumps', price: 'UGX 145,000', link: '/products/classic-pump-heels' },
    { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=85&fit=crop', name: 'Boho Cushions', price: 'UGX 65,000', link: '/products/boho-cushion-covers' },
  ]},
}, { timestamps: true });

module.exports = mongoose.model('HeroConfig', heroConfigSchema);
