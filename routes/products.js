// routes/products.js
const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/', productCtrl.listProducts);
router.get('/:id', productCtrl.getProduct);
router.post('/', protect, isAdmin, upload.array('images', 8), productCtrl.createProduct);
router.put('/:id', protect, isAdmin, upload.array('images', 8), productCtrl.updateProduct);
router.delete('/:id', protect, isAdmin, productCtrl.deleteProduct);

router.post('/:id/review', protect, productCtrl.addReview);

module.exports = router;
