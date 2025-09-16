// controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const slugify = require('slugify');
const Review = require('../models/Review');

exports.createProduct = async (req, res, next) => {
  try {
    const { title, description, price, metalOptions, availableShapes, features, stock, category } = req.body;
    const images = (req.files || []).map(f => `/uploads/${f.filename}`);
    const slug = slugify(title, { lower: true });
    const product = await Product.create({
      title, slug, description, price,
      metalOptions: typeof metalOptions === 'string' ? JSON.parse(metalOptions) : metalOptions,
      availableShapes: typeof availableShapes === 'string' ? JSON.parse(availableShapes) : availableShapes,
      features: typeof features === 'string' ? JSON.parse(features) : features,
      images, stock, category, createdBy: req.user._id
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const pid = req.params.id;
    const updates = req.body;
    if (req.files && req.files.length) {
      updates.images = (req.files || []).map(f => `/uploads/${f.filename}`);
    }
    if (updates.title) updates.slug = slugify(updates.title, { lower: true });
    const product = await Product.findByIdAndUpdate(pid, updates, { new: true });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// exports.getProduct = async (req, res, next) => {
//   try {
//     const product = await Product.findById(req.params.id).populate('category');
//     if (!product) return res.status(404).json({ message: 'Not found' });

//     // load reviews
//     const reviews = await Review.find({ product: product._id }).populate('user', 'name');
//     res.json({ product, reviews });
//   } catch (err) { next(err); }
// };

exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // 2. Find product and populate category
    const product = await Product.findById(id).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 3. Get reviews
    const reviews = await Review.find({ product: product._id }).populate('user', 'name');

    // 4. Respond
    res.json({ product, reviews });

  } catch (err) {
    console.error('Error in getProduct:', err.message);
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '12');
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.shape) filter.availableShapes = req.query.shape;
    if (req.query.metal) filter.metalOptions = req.query.metal;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }
    if (req.query.features) filter.features = { $in: req.query.features.split(',') };
    // full text search
    if (req.query.q) {
      filter.$text = { $search: req.query.q };
    }

    let query = Product.find(filter).skip(skip).limit(limit);
    if (req.query.sort === 'price_asc') query = query.sort({ price: 1 });
    if (req.query.sort === 'price_desc') query = query.sort({ price: -1 });
    if (req.query.sort === 'newest') query = query.sort({ createdAt: -1 });

    const results = await query.exec();
    const total = await Product.countDocuments(filter);
    res.json({
      page, limit, totalPages: Math.ceil(total / limit), total, results
    });
  } catch (err) { next(err); }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      comment
    });
    res.status(201).json(review);
  } catch (err) { next(err); }
};
