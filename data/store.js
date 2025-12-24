/**
 * In-memory data store for the expense sharing system
 * This acts as a singleton for storing all application data
 */

const store = {
  // Store users by their ID
  users: new Map(), // userId -> { id, name }

  // Store groups by their ID
  groups: new Map(), // groupId -> { id, name, members: Set(userId) }

  // Store expenses by their ID
  expenses: new Map(), // expenseId -> { id, groupId, description, category, totalAmount, paidBy, splitType, participants, createdAt }

  // Store balances: groupId -> userId -> netAmount (positive = should receive, negative = owes)
  balances: new Map(), // groupId -> Map(userId -> netAmount)

  /**
   * Get or initialize balances for a group
   */
  getGroupBalances(groupId) {
    if (!this.balances.has(groupId)) {
      this.balances.set(groupId, new Map());
    }
    return this.balances.get(groupId);
  },

  /**
   * Reset all data (useful for testing)
   */
  reset() {
    this.users.clear();
    this.groups.clear();
    this.expenses.clear();
    this.balances.clear();
  }
};

module.exports = store;
