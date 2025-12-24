/**
 * User Routes - Handle user-related endpoints
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /users
 * Create a new user
 * 
 * Request body:
 * {
 *   "name": "John Doe"
 * }
 * 
 * Response:
 * {
 *   "id": "uuid",
 *   "name": "John Doe"
 * }
 */
router.post('/users', (req, res, next) => {
  try {
    const { name } = req.body;

    // Validation using helper
    validate.required(name, 'Name');
    validate.string(name, 'Name');

    // Create user
    const user = {
      id: uuidv4(),
      name: name.trim()
    };

    // Store user
    store.users.set(user.id, user);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /users
 * Get all users (useful for debugging/testing)
 */
router.get('/users', (req, res) => {
  try {
    const users = Array.from(store.users.values());
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /users/:userId
 * Get a specific user
 */
router.get('/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = store.users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
