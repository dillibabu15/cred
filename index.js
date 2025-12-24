/**
 * Main Express Application
 * Splitwise-style Expense Sharing System
 */

const express = require('express');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from public directory

// Routes
app.use('/api', userRoutes); // User routes: /api/users
app.use('/api', groupRoutes); // Group routes: /api/groups

// Health check endpoint (API info)
app.get('/api/info', (req, res) => {
  res.json({ 
    message: 'Splitwise Expense Sharing API',
    version: '1.0.0',
    endpoints: {
      users: 'POST /api/users, GET /api/users',
      groups: 'POST /api/groups, GET /api/groups',
      members: 'POST /api/groups/:groupId/members',
      expenses: 'POST /api/groups/:groupId/expenses, GET /api/groups/:groupId/expenses',
      balances: 'GET /api/groups/:groupId/balances/raw, GET /api/groups/:groupId/balances/simplified'
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Only log errors in development, not during tests
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ Splitwise API server running on http://localhost:${PORT}`);
    console.log(`📝 Ready to handle expense sharing requests!`);
    console.log(`🌐 Open http://localhost:${PORT} to view the demo UI`);
  });
}

module.exports = app;
