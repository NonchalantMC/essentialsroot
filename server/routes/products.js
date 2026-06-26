const express  = require('express');
const router   = express.Router();
const FirestoreService = require('../services/FirestoreService');
const { protect, adminOnly } = require('../middleware/auth');

const ProductService = new FirestoreService('products');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const {
      type, status, featured, tags,
      limit = 20, page = 1, search,
      minPrice, maxPrice,
    } = req.query;

    const query = {};
    if (type)     query.type     = type;
    if (status)   query.status   = status;
    if (featured) query.featured = featured === 'true';

    const options = {
      limit:   Math.min(Number(limit), 100),
      skip:    (Number(page) - 1) * Number(limit),
      orderBy: 'createdAt',
      orderDir:'desc',
      ...(tags && { arrayField: 'tags', arrayValue: tags }),
    };

    let products = await ProductService.find(query, options);

    // Client-side filters for things Firestore can't combine in one query
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(s) ||
        p.category?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
      );
    }
    if (minPrice) products = products.filter(p => p.price >= Number(minPrice));
    if (maxPrice) products = products.filter(p => p.price <= Number(maxPrice));

    const total = products.length;
    res.json({ products, total, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    // Try slug first, then ID
    let product = await ProductService.findOne({ slug: req.params.slug });
    if (!product) product = await ProductService.findById(req.params.slug);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

// POST /api/products (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, price, category, type } = req.body;
    if (!name || !slug || !price || !category || !type) {
      return res.status(400).json({ message: 'name, slug, price, category and type are required' });
    }

    // Check slug uniqueness
    const existing = await ProductService.findOne({ slug });
    if (existing) return res.status(409).json({ message: 'Slug already exists' });

    const product = await ProductService.create({
      ...req.body,
      status:      req.body.status   || 'active',
      featured:    req.body.featured || false,
      rating:      0,
      reviewCount: 0,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Bad request.' });
  }
});

// PATCH /api/products/:id (admin)
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await ProductService.updateById(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Bad request.' });
  }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await ProductService.deleteById(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again.' });
  }
});

module.exports = router;
module.exports.ProductService = ProductService;
