/**
 * Split Service - Implements different expense splitting strategies
 * Uses Strategy Pattern for clean separation of split logic
 */

/**
 * EQUAL split: divide total amount equally among all participants
 * @param {number} totalAmount - Total expense amount in smallest currency unit
 * @param {Array<string>} participants - Array of user IDs
 * @returns {Array<{userId: string, amount: number}>} - Split breakdown
 */
function equalSplit(totalAmount, participants) {
  if (!participants || participants.length === 0) {
    const error = new Error('Participants list cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  const numParticipants = participants.length;
  const baseAmount = Math.floor(totalAmount / numParticipants);
  const remainder = totalAmount % numParticipants;

  // Distribute base amount to all, and remainder to first N participants
  const splits = participants.map((userId, index) => ({
    userId,
    amount: baseAmount + (index < remainder ? 1 : 0)
  }));

  return splits;
}

/**
 * EXACT split: each participant pays a specified exact amount
 * @param {number} totalAmount - Total expense amount
 * @param {Array<{userId: string, amount: number}>} shares - Exact amounts per user
 * @returns {Array<{userId: string, amount: number}>} - Split breakdown
 */
function exactSplit(totalAmount, shares) {
  if (!shares || shares.length === 0) {
    const error = new Error('Shares list cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  // Validate that sum of shares equals total amount
  const sum = shares.reduce((acc, share) => acc + share.amount, 0);
  if (sum !== totalAmount) {
    const error = new Error(`Sum of shares (${sum}) must equal total amount (${totalAmount})`);
    error.statusCode = 400;
    throw error;
  }

  // Validate all amounts are positive
  for (const share of shares) {
    if (share.amount < 0) {
      const error = new Error('Share amounts must be non-negative');
      error.statusCode = 400;
      throw error;
    }
  }

  return shares.map(share => ({
    userId: share.userId,
    amount: share.amount
  }));
}

/**
 * PERCENT split: each participant pays a specified percentage
 * @param {number} totalAmount - Total expense amount
 * @param {Array<{userId: string, percent: number}>} shares - Percentages per user
 * @returns {Array<{userId: string, amount: number}>} - Split breakdown
 */
function percentageSplit(totalAmount, shares) {
  if (!shares || shares.length === 0) {
    const error = new Error('Shares list cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  // Validate that sum of percentages equals 100
  const sumPercent = shares.reduce((acc, share) => acc + share.percent, 0);
  if (Math.abs(sumPercent - 100) > 0.01) { // Allow small floating point errors
    const error = new Error(`Sum of percentages (${sumPercent}) must equal 100`);
    error.statusCode = 400;
    throw error;
  }

  // Validate all percentages are valid
  for (const share of shares) {
    if (share.percent < 0 || share.percent > 100) {
      const error = new Error('Percentages must be between 0 and 100');
      error.statusCode = 400;
      throw error;
    }
  }

  // Calculate amounts based on percentages
  let allocatedAmount = 0;
  const splits = shares.map((share, index) => {
    let amount;
    if (index === shares.length - 1) {
      // Last participant gets the remainder to handle rounding
      amount = totalAmount - allocatedAmount;
    } else {
      amount = Math.round((totalAmount * share.percent) / 100);
      allocatedAmount += amount;
    }
    return {
      userId: share.userId,
      amount
    };
  });

  return splits;
}

/**
 * Main function to split an expense based on split type
 * @param {string} splitType - Type of split (EQUAL, EXACT, PERCENT)
 * @param {number} totalAmount - Total expense amount
 * @param {Array} participants - Participants data (format depends on splitType)
 * @returns {Array<{userId: string, amount: number}>} - Split breakdown
 */
function splitExpense(splitType, totalAmount, participants) {
  switch (splitType) {
    case 'EQUAL':
      return equalSplit(totalAmount, participants);
    case 'EXACT':
      return exactSplit(totalAmount, participants);
    case 'PERCENT':
      return percentageSplit(totalAmount, participants);
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
}

module.exports = {
  splitExpense,
  equalSplit,
  exactSplit,
  percentageSplit
};
