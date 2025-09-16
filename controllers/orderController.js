const Order = require('../models/Order');
const Product = require('../models/Product');
const Diamond = require('../models/Diamond');
const mongoose = require('mongoose');

// Create a new order
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, shippingAddress, tax = 0, shippingCost = 0 } = req.body;

    if (!items || !items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order must have items' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const it of items) {
      const quantity = it.quantity || 1;

      // Fetch product if productId exists
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

        // Decrement product stock
        product.stock -= quantity;
        await product.save({ session });
      }

      // Fetch diamond if diamondId exists
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

        // Decrement diamond stock
        diamond.stock -= quantity;
        await diamond.save({ session });
      }

      const totalPrice = Number(productPrice) + Number(diamondPrice || 0);
      subtotal += totalPrice * quantity;

      orderItems.push({
        product: product ? product._id : undefined,
        productSnapshot,
        diamond: diamond ? diamond._id : undefined,
        diamondSnapshot,
        quantity,
        size: it.size,
        metal: it.metal,
        engraving: it.engraving,
        price: totalPrice
      });
    }

    const total = subtotal + Number(tax) + Number(shippingCost);

    const order = await Order.create([{
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      tax,
      shippingCost,
      total,
      status: 'processing',
      paymentStatus: 'pending'
    }], { session });

    await session.commitTransaction();
    session.endSession();
    res.status(201).json(order[0]);

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// Get orders for logged-in user
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// Get all orders (admin)
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// Update order status (admin)
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
