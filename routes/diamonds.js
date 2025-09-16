// routes/diamonds.js
const express = require('express');
const router = express.Router();
const diamondCtrl = require('../controllers/diamondController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', diamondCtrl.listDiamonds);
router.get('/:id', diamondCtrl.getDiamond);
router.post('/', protect, isAdmin, diamondCtrl.createDiamond);
router.put('/:id', protect, isAdmin, diamondCtrl.updateDiamond);
router.delete('/:id', protect, isAdmin, diamondCtrl.deleteDiamond);

module.exports = router;
