// controllers/contactController.js
const Contact = require('../models/Contact');

// Public: User submits message
exports.createMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const newMessage = await Contact.create({ name, email, message });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin fetch all messages
exports.getMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }); // latest first
    res.json(messages); // Returns full info: _id, name, email, message, timestamps
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

