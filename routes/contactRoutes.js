// routes/contactRoutes.js
const express = require('express');
const { createMessage, getMessages } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin'); // <-- fix here

const router = express.Router();

// Public route: anyone can contact
router.post('/', createMessage);

// Admin only: view all messages
router.get('/', protect, isAdmin, getMessages);

module.exports = router;
