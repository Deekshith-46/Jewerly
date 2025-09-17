// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const Diamond = require('../models/Diamond');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');

/**
 * Simple placeholder tax calculation.
 * Replace with real tax rules per region as needed.
 * Returns tax amount (number).
 */
function calculateTaxAmount(subtotal, country) {
  // minimal example rules (base currency assumed)
  const rates = {
    'India': 0.18,   // 18%
    'USA': 0.07,     // 7%
    'UK': 0.20       // 20%
  };
  const rate = rates[country] ?? 0.10; // default 10%
  return parseFloat((subtotal * rate).toFixed(2));
}

/**
 * Simple placeholder shipping calculation.
 * Replace with carrier integrations / weight-based rules as needed.
 */
function calculateShippingCost(subtotal, country) {
  const rules = {
    'India': 50,    // flat ₹50
    'USA': 10,      // flat $10
    'UK': 12
  };
  // free shipping over threshold (example)
  const freeThreshold = 10000;
  const base = rules[country] ?? 25;
  return subtotal >= freeThreshold ? 0 : base;
}

/**
 * applyCoupon helper
 * - Validates coupon existence, active, expiry, usage limits
 * - Calculates discountAmount (capped to subtotal)
 * - Updates coupon usage counts inside the provided session (if any)
 *
 * Returns { discountAmount, couponId } on success
 * Throws an Error (with message) on invalid coupon conditions
 */
async function applyCoupon(subtotal, couponCode, userId, session = null) {
  if (!couponCode) return { discountAmount: 0, couponId: null };

  // normalize
  const normalizedCode = String(couponCode).toUpperCase();

  // find coupon (include inactive? we require active)
  const coupon = await Coupon.findOne({ code: normalizedCode }).session(session);

  if (!coupon) throw new Error('Coupon not found');
  if (!coupon.active) throw new Error('Coupon is not active');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('Coupon has expired');

  // support different field names safely
  const usageLimit = coupon.usageLimit ?? coupon.maxUses ?? 0; // 0 => unlimited
  const usedCount = coupon.usedCount ?? coupon.timesUsed ?? 0;
  const perUserLimit = coupon.perUserLimit ?? coupon.per_user_limit ?? 0;

  // global usage check
  if (usageLimit > 0 && usedCount >= usageLimit) {
    throw new Error('Coupon usage limit reached');
  }

  // per-user check — count previous orders by this user with this coupon
  if (perUserLimit > 0 && userId) {
    const usedByUser = await Order.countDocuments({ user: userId, coupon: coupon._id }).session(session);
    if (usedByUser >= perUserLimit) {
      throw new Error('You have already used this coupon the maximum allowed times');
    }
  }

  // calculate discount depending on coupon.type
  // support types: 'percentage', 'percent', 'fixed', 'flat'
  let discountAmount = 0;
  const type = (coupon.type || '').toString().toLowerCase();
  const value = Number(coupon.value ?? coupon.discountValue ?? 0);

  if (['percentage', 'percent'].includes(type)) {
    discountAmount = parseFloat(((subtotal * value) / 100).toFixed(2));
  } else if (['fixed', 'flat'].includes(type)) {
    discountAmount = parseFloat(Number(value).toFixed(2));
  } else {
    throw new Error('Invalid coupon type');
  }

  // don't allow discount > subtotal
  if (discountAmount > subtotal) discountAmount = subtotal;

  // update coupon usage (within session to be atomic with order)
  // increase usedCount/timesUsed and optionally push user id into usersUsed
  if (session) {
    if (coupon.usedCount !== undefined) coupon.usedCount = (coupon.usedCount || 0) + 1;
    if (coupon.timesUsed !== undefined) coupon.timesUsed = (coupon.timesUsed || 0) + 1;
    // push usersUsed array if exists (keeps record)
    if (coupon.usersUsed && Array.isArray(coupon.usersUsed)) {
      coupon.usersUsed.push(userId);
    }
    await coupon.save({ session });
  } else {
    // no session provided — still update coupon
    if (coupon.usedCount !== undefined) coupon.usedCount = (coupon.usedCount || 0) + 1;
    if (coupon.timesUsed !== undefined) coupon.timesUsed = (coupon.timesUsed || 0) + 1;
    if (coupon.usersUsed && Array.isArray(coupon.usersUsed)) {
      coupon.usersUsed.push(userId);
    }
    await coupon.save();
  }

  return { discountAmount, couponId: coupon._id };
}

/**
 * Main createOrder controller
 * - calculates subtotal by reading product + diamond prices & decrementing stock
 * - calculates server-side tax and shippingCost if not provided
 * - uses applyCoupon(...) helper inside the same transaction
 * - writes order and commits transaction
 */
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, shippingAddress, couponCode } = req.body;

    if (!items || !items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order must have items' });
    }

    // accumulate
    let subtotal = 0;
    const orderItems = [];

    // 1) validate and reserve stock for each item
    for (const it of items) {
      const quantity = it.quantity || 1;

      // Product part
      let product = null;
      let productSnapshot = null;
      let productPrice = 0;
      if (it.productId) {
        product = await Product.findById(it.productId).session(session);
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: `Product ${it.productId} not found` });
        }
        if (product.stock < quantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: `Insufficient stock for product ${product.title}` });
        }
        productSnapshot = {
          title: product.title,
          slug: product.slug,
          description: product.description,
          price: product.price,
          metalOptions: product.metalOptions,
          availableShapes: product.availableShapes,
          features: product.features,
          images: product.images
        };
        productPrice = product.price;

        product.stock -= quantity;
        await product.save({ session });
      }

      // Diamond part
      let diamond = null;
      let diamondSnapshot = null;
      let diamondPrice = 0;
      if (it.diamondId) {
        diamond = await Diamond.findById(it.diamondId).session(session);
        if (!diamond) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: `Diamond ${it.diamondId} not found` });
        }
        if (diamond.stock < quantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: `Insufficient diamond stock for ${diamond.sku}` });
        }
        diamondSnapshot = {
          sku: diamond.sku,
          shape: diamond.shape,
          carat: diamond.carat,
          cut: diamond.cut,
          clarity: diamond.clarity,
          color: diamond.color,
          price: diamond.price
        };
        diamondPrice = diamond.price;

        diamond.stock -= quantity;
        await diamond.save({ session });
      }

      const unitPrice = parseFloat((Number(productPrice) + Number(diamondPrice || 0)).toFixed(2));
      subtotal += unitPrice * quantity;

      orderItems.push({
        product: product ? product._id : undefined,
        productSnapshot,
        diamond: diamond ? diamond._id : undefined,
        diamondSnapshot,
        quantity,
        size: it.size,
        metal: it.metal,
        engraving: it.engraving,
        price: unitPrice
      });
    }

    // 2) pick tax & shipping — server-side defaults if frontend didn't pass them
    // NOTE: req.body.tax and req.body.shippingCost are allowed to override, but server computes if absent
    const providedTax = (req.body.tax !== undefined && req.body.tax !== null) ? Number(req.body.tax) : null;
    const providedShipping = (req.body.shippingCost !== undefined && req.body.shippingCost !== null) ? Number(req.body.shippingCost) : null;

    // compute using shippingAddress.country (best-effort)
    const country = (shippingAddress && shippingAddress.country) ? shippingAddress.country : null;
    const taxAmount = providedTax ?? calculateTaxAmount(subtotal, country);
    const shippingCost = providedShipping ?? calculateShippingCost(subtotal, country);

    // 3) coupon application using helper, inside same session
    let discountAmount = 0;
    let appliedCouponId = null;
    if (couponCode) {
      try {
        const result = await applyCoupon(subtotal, couponCode, req.user ? req.user._id : null, session);
        discountAmount = result.discountAmount || 0;
        appliedCouponId = result.couponId || null;
      } catch (couponErr) {
        // abort transaction and return coupon error (do not create order)
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: couponErr.message });
      }
    }

    // 4) totals
    const totalBeforeDiscount = parseFloat((subtotal + Number(taxAmount) + Number(shippingCost)).toFixed(2));
    const finalTotal = parseFloat((subtotal - discountAmount + Number(taxAmount) + Number(shippingCost)).toFixed(2));

    // 5) create order
    const [order] = await Order.create([{
      user: req.user ? req.user._id : null, // keep null for guests in future (but your route is protect now)
      items: orderItems,
      shippingAddress,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: Number(taxAmount),
      shippingCost: Number(shippingCost),
      total: totalBeforeDiscount,        // before discount
      coupon: appliedCouponId,
      discountAmount,
      finalTotal,
      status: 'processing',
      paymentStatus: 'pending'
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // respond
    return res.status(201).json(order);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// Other handlers unchanged
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = req.body.status || order.status;
    order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
};

