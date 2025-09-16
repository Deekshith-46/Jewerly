// controllers/diamondController.js
const Diamond = require('../models/Diamond');

exports.createDiamond = async (req, res, next) => {
  try {
    const { sku, shape, carat, cut, clarity, color, labGrown, price, stock, certificate } = req.body;
    const d = await Diamond.create({ sku, shape, carat, cut, clarity, color, labGrown, price, stock, certificate });
    res.status(201).json(d);
  } catch (err) { next(err); }
};

exports.listDiamonds = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.shape) filter.shape = req.query.shape;
    if (req.query.minCarat || req.query.maxCarat) {
      filter.carat = {};
      if (req.query.minCarat) filter.carat.$gte = Number(req.query.minCarat);
      if (req.query.maxCarat) filter.carat.$lte = Number(req.query.maxCarat);
    }
    if (req.query.labGrown) filter.labGrown = req.query.labGrown === 'true';
    if (req.query.available) filter.available = req.query.available === 'true';

    const results = await Diamond.find(filter).limit(200);
    res.json(results);
  } catch (err) { next(err); }
};

exports.getDiamond = async (req, res, next) => {
  try {
    const d = await Diamond.findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Not found' });
    res.json(d);
  } catch (err) { next(err); }
};

exports.updateDiamond = async (req, res, next) => {
  try {
    const d = await Diamond.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(d);
  } catch (err) { next(err); }
};

exports.deleteDiamond = async (req, res, next) => {
  try {
    await Diamond.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
