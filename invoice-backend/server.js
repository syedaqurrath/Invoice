const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoice');
const authMiddleware = require('./middleware/authMiddleware');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.get('/api/dashboard', authMiddleware, (req, res) => {
  res.json({ message: `Welcome to the Dashboard, ${req.user.username}` });
});

// Test route
app.get('/', (req, res) => {
  res.send('Invoice Backend Running...');
});

app.get('/api/dashboard', (req, res) => {
  res.json({ message: 'Welcome to the Dashboard' });
});


// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
