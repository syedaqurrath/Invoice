const express = require('express');
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Create a new invoice
router.post('/', authMiddleware, async (req, res) => {
  const { items } = req.body;
  const userId = req.user.id;

  try {
    // Calculate totalAmount
    const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

    const newInvoice = new Invoice({
      user: userId,
      items,
      totalAmount,
      status: 'Pending'
    });

    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error });
  }
});

// Get all invoices for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error });
  }
});

// Get a single invoice by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    if (invoice.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized access' });

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error });
  }
});

module.exports = router;
