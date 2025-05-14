const express = require('express');
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Apply auth middleware to all invoice routes
router.use(authMiddleware);

// Create a new invoice
router.post('/', async (req, res) => {
  try {
    // Log the complete request
    console.log('Creating invoice - Complete request:', {
      body: req.body,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      headers: req.headers
    });

    const { items } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Invalid items array:', items);
      return res.status(400).json({ 
        message: 'Invalid items: Items array is required',
        received: items 
      });
    }

    // Log each item before validation
    console.log('Validating items:', items);

    // Validate each item
    for (const item of items) {
      console.log('Checking item:', item);
      if (!item.description || !item.quantity || item.price === undefined) {
        console.log('Invalid item structure:', item);
        return res.status(400).json({ 
          message: 'Invalid item: Each item must have description, quantity, and price',
          invalidItem: item
        });
      }
      if (item.quantity < 1) {
        console.log('Invalid quantity:', item);
        return res.status(400).json({ 
          message: 'Invalid quantity: Must be greater than 0',
          invalidItem: item
        });
      }
      if (item.price < 0) {
        console.log('Invalid price:', item);
        return res.status(400).json({ 
          message: 'Invalid price: Must be greater than or equal to 0',
          invalidItem: item
        });
      }
    }

    // Calculate totalAmount
    const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    console.log('Calculated total amount:', totalAmount);

    // Create invoice object
    const invoiceData = {
      user: req.user._id,
      items: items.map(item => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        price: Number(item.price)
      })),
      totalAmount,
      status: 'Pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    console.log('Creating invoice with data:', invoiceData);

    const newInvoice = new Invoice(invoiceData);
    console.log('Created invoice object:', newInvoice);

    // Save to database
    try {
      await newInvoice.save();
      console.log('Invoice saved successfully');
      res.status(201).json(newInvoice);
    } catch (dbError) {
      console.error('Database error while saving invoice:', dbError);
      res.status(500).json({ 
        message: 'Error saving invoice to database',
        error: dbError.message,
        validationErrors: dbError.errors
      });
    }
  } catch (error) {
    console.error('Error in invoice creation:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error creating invoice',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all invoices for the logged-in user
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

// Get a single invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { items, status } = req.body;

    // Validate items if provided
    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Invalid items: Items array is required' });
      }

      // Validate each item
      for (const item of items) {
        if (!item.description || !item.quantity || !item.price) {
          return res.status(400).json({ 
            message: 'Invalid item: Each item must have description, quantity, and price' 
          });
        }
        if (item.quantity < 1) {
          return res.status(400).json({ message: 'Invalid quantity: Must be greater than 0' });
        }
        if (item.price < 0) {
          return res.status(400).json({ message: 'Invalid price: Must be greater than or equal to 0' });
        }
      }

      invoice.items = items.map(item => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        price: Number(item.price)
      }));
      invoice.totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    }

    // Update status if provided
    if (status) {
      if (!['Pending', 'Paid', 'Overdue', 'Cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      invoice.status = status;
    }

    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting invoice', error: error.message });
  }
});

// Add this route to handle status updates
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Paid', 'Overdue', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const invoice = await Invoice.findOne({ _id: id, user: req.user._id });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.status = status;
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: 'Error updating invoice status' });
  }
});

module.exports = router;
