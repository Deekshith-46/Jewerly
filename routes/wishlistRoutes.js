const express = require('express');
const { addToWishlist, removeFromWishlist, getWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/:productId', protect, addToWishlist);
router.delete('/:productId', protect, removeFromWishlist);
router.get('/', protect, getWishlist);

module.exports = router;
