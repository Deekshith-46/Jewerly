// routes/users.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userCtrl = require('../controllers/userController');

router.get('/me', protect, userCtrl.getMe);
router.put('/me', protect, userCtrl.updateProfile);

module.exports = router;
