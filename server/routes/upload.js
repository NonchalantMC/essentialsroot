const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary');           // v1: import root, not .v2
const { protect, adminOnly } = require('../middleware/auth');

// v1 config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits:    { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
});

// POST /api/upload/image  (admin only)
router.post('/image', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image provided' });

  const b64     = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;

  // v1 uploader API
  cloudinary.uploader.upload(
    dataURI,
    {
      folder:         'essentials256/products',
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' }],
    },
    (error, result) => {
      if (error) return res.status(500).json({ message: process.env.NODE_ENV === 'development' ? error.message : 'Image upload failed.' });
      res.json({ url: result.secure_url, publicId: result.public_id });
    }
  );
});

// DELETE /api/upload/image/:publicId  (admin only)
router.delete('/image/:publicId', protect, adminOnly, (req, res) => {
  cloudinary.uploader.destroy(req.params.publicId, (error) => {
    if (error) return res.status(500).json({ message: process.env.NODE_ENV === 'development' ? error.message : 'Image deletion failed.' });
    res.json({ message: 'Image deleted' });
  });
});

module.exports = router;
