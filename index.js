require('dotenv').config();
require('./models/Category');
const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect DB
connectDB();

// --- middleware (must come before routes) ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // parse json
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// rate limiter
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120
});
app.use(limiter);

// --- routes ---
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const diamondRoutes = require('./routes/diamonds');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/diamonds', diamondRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Mount extra routes (AFTER middleware)
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/users/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/users/addresses', require('./routes/addressRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// error handler
app.use(errorHandler);

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV})`);
});
