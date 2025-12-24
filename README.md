# Splitwise Expense Sharing System

A clean, production-ready expense sharing backend built with Node.js and Express. Split bills, track balances, and settle debts efficiently.

## 🚀 Quick Start

```bash
npm install
npm start
```

Visit **http://localhost:3000** for the demo UI.

## ✨ Features

- **Multiple Split Types**: Equal, Exact amounts, Percentages
- **Smart Balance Simplification**: Minimizes transactions using greedy algorithm
- **Input Validation**: Custom middleware for safe data handling
- **Comprehensive Tests**: 18 tests covering all scenarios
- **Clean UI**: Easy-to-use interface with auto-populated dropdowns

## 📡 API Endpoints

### Users
```
POST   /api/users              Create user
GET    /api/users              Get all users
```

### Groups
```
POST   /api/groups             Create group
GET    /api/groups             Get all groups
POST   /api/groups/:id/members Add member to group
```

### Expenses
```
POST   /api/groups/:id/expenses         Add expense
GET    /api/groups/:id/expenses         Get all expenses
GET    /api/groups/:id/balances/raw     Get raw balances
GET    /api/groups/:id/balances/simplified  Get minimal transactions
```

## 🧪 Testing

```bash
npm test
```

All 18 tests pass with 100% success rate.

## 🎯 Split Types

### Equal
Split amount equally among all participants
```json
{
  "splitType": "EQUAL",
  "participants": ["userId1", "userId2"]
}
```

### Exact
Specify exact amount for each person
```json
{
  "splitType": "EXACT",
  "participants": [
    {"userId": "userId1", "amount": 3000},
    {"userId": "userId2", "amount": 2000}
  ]
}
```

### Percent
Specify percentage for each person (must total 100%)
```json
{
  "splitType": "PERCENT",
  "participants": [
    {"userId": "userId1", "percent": 60},
    {"userId": "userId2", "percent": 40}
  ]
}
```

## 🏗️ Architecture

```
├── index.js              # Express server
├── routes/               # API route handlers
├── services/             # Business logic (split & balance calculations)
├── middleware/           # Validation middleware
├── data/                 # In-memory data store
├── tests/                # Jest test suite
└── public/               # Demo UI
```

## 💡 Key Algorithm

**Balance Simplification** (O(n log n)):
1. Calculate net balance for each user
2. Separate creditors and debtors
3. Sort both lists by amount
4. Greedily match largest debtor with largest creditor
5. Minimize total transactions

## 📝 Tech Stack

- **Backend**: Node.js, Express
- **Testing**: Jest, Supertest
- **Storage**: In-memory (easily replaceable with database)
- **Validation**: Custom middleware (zero dependencies)

## 🔄 Reset Data

```bash
curl -X DELETE http://localhost:3000/api/reset
```

## 📄 License

ISC
