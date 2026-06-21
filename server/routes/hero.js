const express  = require('express');
const router   = express.Router();
const { db }   = require('../config/firebase');
const { protect, adminOnly } = require('../middleware/auth');

const HERO_DOC = db.collection('_config').doc('hero');

const DEFAULT_HERO = {
  eyebrow:      'New Season Arrivals',
  heading:      'Where *Style* Meets Your Space',
  subheading:   'Your Essentials for a Perfect Home & Lifestyle',
  ctaPrimary:   { label: 'Shop Footwear', link: '/footwear' },
  ctaSecondary: { label: 'Explore Decor', link: '/decor'    },
  stat1: { value: '500+', label: 'Products'   },
  stat2: { value: '4.8★', label: 'Avg Rating' },
  stat3: { value: '1K+',  label: 'Customers'  },
  images: [
    { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&q=85&fit=crop', name: 'Classic Pumps', price: 'UGX 145,000', link: '/products/classic-pump-heels' },
    { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=85&fit=crop', name: 'Boho Cushions', price: 'UGX 65,000', link: '/products/boho-cushion-covers' },
  ],
};

// GET /api/hero — public
router.get('/', async (req, res) => {
  try {
    const doc = await HERO_DOC.get();
    if (!doc.exists) {
      // Create default on first request
      await HERO_DOC.set({ ...DEFAULT_HERO, updatedAt: new Date().toISOString() });
      return res.json(DEFAULT_HERO);
    }
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/hero — admin only
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    await HERO_DOC.set(data);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
