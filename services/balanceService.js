/**
 * Balance Service - Manages user balances and simplification
 * Handles balance updates when expenses are added and provides simplified transactions
 */

const store = require('../data/store');

/**
 * Apply an expense to update balances
 * When someone pays for an expense:
 * - The payer's balance increases by the total amount
 * - Each participant's balance decreases by their share
 * 
 * @param {string} groupId - Group ID
 * @param {string} paidBy - User ID who paid
 * @param {number} totalAmount - Total amount paid
 * @param {Array<{userId: string, amount: number}>} splits - How the expense is split
 */
function applyExpense(groupId, paidBy, totalAmount, splits) {
  const balances = store.getGroupBalances(groupId);

  // Initialize payer's balance if not exists
  if (!balances.has(paidBy)) {
    balances.set(paidBy, 0);
  }

  // Payer's balance increases by the total amount they paid
  balances.set(paidBy, balances.get(paidBy) + totalAmount);

  // Decrease each participant's balance by their share
  for (const split of splits) {
    const { userId, amount } = split;
    
    // Initialize user's balance if not exists
    if (!balances.has(userId)) {
      balances.set(userId, 0);
    }

    // Subtract the amount from their balance
    balances.set(userId, balances.get(userId) - amount);
  }
}

/**
 * Get raw net balances for a group
 * Positive balance = user should receive money
 * Negative balance = user owes money
 * 
 * @param {string} groupId - Group ID
 * @returns {Object} - Map of userId to net balance
 */
function getNetBalances(groupId) {
  const balances = store.getGroupBalances(groupId);
  const result = {};

  for (const [userId, balance] of balances.entries()) {
    result[userId] = balance;
  }

  return result;
}

/**
 * Simplify balances using greedy algorithm
 * Creates minimal number of transactions to settle all debts
 * 
 * Algorithm:
 * 1. Separate users into creditors (positive balance) and debtors (negative balance)
 * 2. Sort creditors in descending order and debtors in ascending order
 * 3. Match largest creditor with largest debtor until all settled
 * 
 * @param {string} groupId - Group ID
 * @returns {Array<{from: string, to: string, amount: number}>} - Simplified transactions
 */
function simplifyBalances(groupId) {
  const balances = store.getGroupBalances(groupId);
  
  // Separate into creditors (positive) and debtors (negative)
  const creditors = [];
  const debtors = [];

  for (const [userId, balance] of balances.entries()) {
    if (balance > 0) {
      creditors.push({ userId, amount: balance });
    } else if (balance < 0) {
      debtors.push({ userId, amount: Math.abs(balance) });
    }
    // Skip users with balance = 0
  }

  // Sort creditors descending (largest credits first)
  creditors.sort((a, b) => b.amount - a.amount);
  
  // Sort debtors descending (largest debts first)
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let creditorIdx = 0;
  let debtorIdx = 0;

  // Greedy matching: pair largest creditor with largest debtor
  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];

    // Determine the transaction amount (minimum of what's owed and what's due)
    const transactionAmount = Math.min(creditor.amount, debtor.amount);

    // Create transaction
    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: transactionAmount
    });

    // Update remaining amounts
    creditor.amount -= transactionAmount;
    debtor.amount -= transactionAmount;

    // Move to next creditor if current one is settled
    if (creditor.amount === 0) {
      creditorIdx++;
    }

    // Move to next debtor if current one is settled
    if (debtor.amount === 0) {
      debtorIdx++;
    }
  }

  return transactions;
}

/**
 * Apply a settlement transaction
 * Settlement is treated as a special expense where one user pays another
 * 
 * @param {string} groupId - Group ID
 * @param {string} fromUserId - User who is paying
 * @param {string} toUserId - User who is receiving
 * @param {number} amount - Settlement amount
 */
function applySettlement(groupId, fromUserId, toUserId, amount) {
  const balances = store.getGroupBalances(groupId);

  // Initialize balances if not exist
  if (!balances.has(fromUserId)) {
    balances.set(fromUserId, 0);
  }
  if (!balances.has(toUserId)) {
    balances.set(toUserId, 0);
  }

  // From user's balance increases (they paid)
  balances.set(fromUserId, balances.get(fromUserId) + amount);
  
  // To user's balance decreases (they received)
  balances.set(toUserId, balances.get(toUserId) - amount);
}

module.exports = {
  applyExpense,
  getNetBalances,
  simplifyBalances,
  applySettlement
};
