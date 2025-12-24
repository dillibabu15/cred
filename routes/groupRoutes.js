/**
 * Group Routes - Handle group and expense-related endpoints
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { splitExpense } = require('../services/splitService');
const { applyExpense, getNetBalances, simplifyBalances } = require('../services/balanceService');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /groups
 * Create a new group
 * 
 * Request body:
 * {
 *   "name": "Trip to Goa",
 *   "createdBy": "userId"
 * }
 */
router.post('/groups', (req, res, next) => {
  try {
    const { name, createdBy } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (!createdBy || !store.users.has(createdBy)) {
      return res.status(400).json({ error: 'Valid createdBy user ID is required' });
    }

    // Create group
    const group = {
      id: uuidv4(),
      name: name.trim(),
      members: new Set([createdBy]), // Creator is automatically a member
      createdBy,
      createdAt: new Date().toISOString()
    };

    store.groups.set(group.id, group);

    res.status(201).json({
      id: group.id,
      name: group.name,
      members: Array.from(group.members),
      createdBy: group.createdBy,
      createdAt: group.createdAt
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /groups/:groupId/members
 * Add a member to a group
 * 
 * Request body:
 * {
 *   "userId": "uuid"
 * }
 */
router.post('/groups/:groupId/members', (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    // Validation
    const group = store.groups.get(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!userId || !store.users.has(userId)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    if (group.members.has(userId)) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    // Add member
    group.members.add(userId);

    res.json({
      id: group.id,
      name: group.name,
      members: Array.from(group.members)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /groups/:groupId
 * Get group details
 */
router.get('/groups/:groupId', (req, res) => {
  try {
    const { groupId } = req.params;
    const group = store.groups.get(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      id: group.id,
      name: group.name,
      members: Array.from(group.members),
      createdBy: group.createdBy,
      createdAt: group.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /groups/:groupId/expenses
 * Add an expense to a group
 * 
 * Request body:
 * {
 *   "description": "Dinner at restaurant",
 *   "category": "food",
 *   "totalAmount": 3000,
 *   "paidBy": "userId",
 *   "splitType": "EQUAL" | "EXACT" | "PERCENT",
 *   "participants": [...] // format depends on splitType
 * }
 * 
 * For EQUAL: participants = ["userId1", "userId2"]
 * For EXACT: participants = [{ userId: "userId1", amount: 1500 }, { userId: "userId2", amount: 1500 }]
 * For PERCENT: participants = [{ userId: "userId1", percent: 60 }, { userId: "userId2", percent: 40 }]
 */
router.post('/groups/:groupId/expenses', (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { description, category, totalAmount, paidBy, splitType, participants } = req.body;

    // Validation
    const group = store.groups.get(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Category is required' });
    }

    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ error: 'Total amount must be a positive number' });
    }

    if (!paidBy || !store.users.has(paidBy)) {
      return res.status(400).json({ error: 'Valid paidBy user ID is required' });
    }

    if (!group.members.has(paidBy)) {
      return res.status(400).json({ error: 'Payer must be a member of the group' });
    }

    if (!splitType || !['EQUAL', 'EXACT', 'PERCENT'].includes(splitType)) {
      return res.status(400).json({ error: 'Split type must be EQUAL, EXACT, or PERCENT' });
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'Participants list is required' });
    }

    // Validate all participants are group members
    const participantIds = splitType === 'EQUAL' 
      ? participants 
      : participants.map(p => p.userId);

    for (const userId of participantIds) {
      if (!group.members.has(userId)) {
        return res.status(400).json({ 
          error: `User ${userId} is not a member of this group` 
        });
      }
    }

    // Calculate splits using splitService
    const splits = splitExpense(splitType, totalAmount, participants);

    // Create expense
    const expense = {
      id: uuidv4(),
      groupId,
      description,
      category,
      totalAmount,
      paidBy,
      splitType,
      participants,
      splits, // Store the calculated splits
      createdAt: new Date().toISOString()
    };

    store.expenses.set(expense.id, expense);

    // Update balances using balanceService
    applyExpense(groupId, paidBy, totalAmount, splits);

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /groups/:groupId/expenses
 * Get all expenses for a group
 */
router.get('/groups/:groupId/expenses', (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if group exists
    if (!store.groups.has(groupId)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get all expenses for this group
    const groupExpenses = Array.from(store.expenses.values())
      .filter(expense => expense.groupId === groupId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Most recent first

    res.json(groupExpenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /groups/:groupId/balances/raw
 * Get raw net balances for all users in a group
 * Positive = user should receive money
 * Negative = user owes money
 */
router.get('/groups/:groupId/balances/raw', (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if group exists
    if (!store.groups.has(groupId)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const balances = getNetBalances(groupId);
    res.json({ groupId, balances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /groups/:groupId/balances/simplified
 * Get simplified transactions to settle all balances
 * Returns minimal set of transactions using greedy algorithm
 */
router.get('/groups/:groupId/balances/simplified', (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if group exists
    if (!store.groups.has(groupId)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const transactions = simplifyBalances(groupId);
    res.json({ 
      groupId, 
      transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /groups
 * Get all groups (useful for debugging/testing)
 */
router.get('/groups', (req, res) => {
  try {
    const groups = Array.from(store.groups.values()).map(group => ({
      id: group.id,
      name: group.name,
      members: Array.from(group.members),
      createdBy: group.createdBy,
      createdAt: group.createdAt
    }));
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /reset
 * Reset all data (users, groups, expenses, balances)
 */
router.delete('/reset', (req, res) => {
  try {
    store.reset();
    res.json({ 
      message: 'All data has been reset successfully',
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
