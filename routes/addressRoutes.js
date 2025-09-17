// routes/addressRoutes.js
const express = require('express');
const { addAddress, getAddresses, removeAddress } = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, addAddress);
router.get('/', protect, getAddresses);
router.delete('/:id', protect, removeAddress);

module.exports = router;
