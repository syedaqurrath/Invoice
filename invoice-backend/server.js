const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Verify required environment variables
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set in environment variables');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoice');
const authMiddleware = require('./middleware/authMiddleware');

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.method !== 'GET') {
    console.log('Body:', req.body);
  }
  next();
});

// Basic test routes
app.get('/', (req, res) => {
  res.json({ message: 'Invoice Backend Running...' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Auth routes test endpoint
app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth routes are working' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', authMiddleware, invoiceRoutes);

// 404 handler - Must come after all other routes
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.path);
  res.status(404).json({ 
    message: 'Route not found',
    requested: {
      method: req.method,
      path: req.path,
      url: req.url
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("\nMongoDB connected");
  
  // Print available routes
  console.log('\nAvailable routes:');
  console.log('GET  /');
  console.log('GET  /api/test');
  console.log('GET  /api/auth/test');
  console.log('POST /api/auth/login');
  console.log('POST /api/auth/signup');
  console.log('GET  /api/invoices');
  console.log('POST /api/invoices');
  
  // Start server
  app.listen(PORT, () => {
    console.log(`\nServer running on port ${PORT}`);
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
      port: PORT
    });
    
    console.log('\nTest the API with these commands:');
    console.log('1. Test basic API:');
    console.log(`   curl http://localhost:${PORT}/api/test`);
    console.log('\n2. Test auth routes:');
    console.log(`   curl http://localhost:${PORT}/api/auth/test`);
    console.log('\n3. Test login:');
    console.log(`   curl -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' http://localhost:${PORT}/api/auth/login`);
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
