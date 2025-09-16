// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { check, validationResult } = require('express-validator');

router.post('/register', [
  check('name', 'Name required').notEmpty(),
  check('email', 'Valid email required').isEmail(),
  check('password', 'Password min 6 chars').isLength({ min: 6 })
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return register(req, res, next);
});

router.post('/login', [
  check('email', 'Valid email required').isEmail(),
  check('password', 'Password required').notEmpty()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return login(req, res, next);
});

module.exports = router;
