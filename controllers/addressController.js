// controllers/addressController.js
const User = require('../models/User');

exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.push(req.body);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.id
    );
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
