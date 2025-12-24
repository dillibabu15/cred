# Splitwise-Style Expense Sharing System

A **production-ready** backend expense sharing system built with Node.js and Express. Features multiple split types, balance tracking, intelligent balance simplification, comprehensive testing, and robust error handling.

## ✅ Production-Ready Features

- 🛡️ **Input Validation** - Custom validation middleware for all endpoints
- 🚨 **Error Handling** - Global error middleware with proper status codes
- 🧪 **Test Coverage** - 16 comprehensive tests (100% pass rate)
- 🏗️ **Clean Architecture** - Strategy pattern for extensible split types
- ⚡ **Greedy Algorithm** - O(n log n) balance simplification
- 📝 **Well-Documented** - Complete API documentation and examples

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Run the Server

```bash
npm start
```

### Run Tests

```bash
npm test
```

**Expected Output:**
```
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

Server will start on `http://localhost:3000`

### Access the Demo UI

Open your browser and navigate to:
```
http://localhost:3000
```

The UI provides a visual interface to test all backend features without writing API calls manually.

## 📋 Features

- ✅ User management
- ✅ Group creation and member management
- ✅ Three split types: EQUAL, EXACT, PERCENT
- ✅ Automatic balance tracking
- ✅ Greedy algorithm for balance simplification
- ✅ Clean, interview-quality code
- ✅ In-memory storage (no database required)
- ✅ **Demo UI for easy testing and visualization**
- ✅ **Comprehensive test suite**
- ✅ **Production-grade error handling**

## 🚀 Quick Example

```bash
# 1. Create users
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d "{\"name\":\"Alice\"}"
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d "{\"name\":\"Bob\"}"

# 2. Create group (use Alice's ID)
curl -X POST http://localhost:3000/api/groups -H "Content-Type: application/json" \
  -d "{\"name\":\"Vacation\",\"createdBy\":\"<alice-id>\"}"

# 3. Add Bob to group
curl -X POST http://localhost:3000/api/groups/<group-id>/members -H "Content-Type: application/json" \
  -d "{\"userId\":\"<bob-id>\"}"

# 4. Add expense (Alice paid 1000 for dinner, split equally)
curl -X POST http://localhost:3000/api/groups/<group-id>/expenses -H "Content-Type: application/json" \
  -d "{\"description\":\"Dinner\",\"category\":\"food\",\"totalAmount\":1000,\"paidBy\":\"<alice-id>\",\"splitType\":\"EQUAL\",\"participants\":[\"<alice-id>\",\"<bob-id>\"]}"

# 5. Check balances
curl http://localhost:3000/api/groups/<group-id>/balances/simplified
# Result: Bob owes Alice 500
```

## 🏗️ Architecture

```
/
├── index.js                 # Express app entry point
├── tests/
│   └── api.test.js         # Comprehensive API tests (16 tests)
├── middleware/
│   └── validation.js       # Custom validation helpers
├── public/
│   └── index.html          # Demo UI (optional, for testing)
├── data/
│   └── store.js            # In-memory data store
├── routes/
│   ├── userRoutes.js       # User endpoints
│   └── groupRoutes.js      # Group & expense endpoints
└── services/
    ├── splitService.js     # Split logic (Strategy pattern)
    └── balanceService.js   # Balance calculations
```

## 🎯 Design Decisions

### Why This Approach?

1. **Strategy Pattern** - Extensible split types (easily add new types)
2. **Greedy Algorithm** - Optimal O(n log n) balance simplification
3. **Custom Validation** - No external dependencies, lightweight and efficient
4. **In-Memory Store** - Perfect for demonstration, easily replaceable with database
5. **Comprehensive Tests** - Ensures code quality and reliability
6. **Error Handling** - Production-grade error management with proper status codes

### Performance Characteristics

- **Expense Split**: O(n) where n = number of participants
- **Balance Calculation**: O(1) update per expense
- **Balance Simplification**: O(n log n) using greedy algorithm with sorting
- **Space Complexity**: O(u + g + e) where u=users, g=groups, e=expenses

### Algorithm Highlights

**Balance Simplification Algorithm:**
```
1. Calculate net balances for all users
2. Separate into creditors (owed money) and debtors (owe money)
3. Sort both lists by amount (descending)
4. Greedily match largest debtor with largest creditor
5. Settle as much as possible, update amounts
6. Repeat until all balances are zero
```

This reduces the number of transactions to **at most n-1** (where n = number of participants).

## 📡 API Endpoints

### Users

**Create User**
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe"
}
```

**Get All Users**
```http
GET /api/users
```

### Groups

**Create Group**
```http
POST /api/groups
Content-Type: application/json

{
  "name": "Trip to Goa",
  "createdBy": "user-id"
}
```

**Add Member to Group**
```http
POST /api/groups/:groupId/members
Content-Type: application/json

{
  "userId": "user-id"
}
```

**Get Group Details**
```http
GET /api/groups/:groupId
```

### Expenses

**Create Expense - EQUAL Split**
```http
POST /api/groups/:groupId/expenses
Content-Type: application/json

{
  "description": "Dinner at restaurant",
  "category": "food",
  "totalAmount": 3000,
  "paidBy": "user-id",
  "splitType": "EQUAL",
  "participants": ["user-id-1", "user-id-2", "user-id-3"]
}
```

**Create Expense - EXACT Split**
```http
POST /api/groups/:groupId/expenses
Content-Type: application/json

{
  "description": "Shopping",
  "category": "other",
  "totalAmount": 5000,
  "paidBy": "user-id",
  "splitType": "EXACT",
  "participants": [
    { "userId": "user-id-1", "amount": 2000 },
    { "userId": "user-id-2", "amount": 3000 }
  ]
}
```

**Create Expense - PERCENT Split**
```http
POST /api/groups/:groupId/expenses
Content-Type: application/json

{
  "description": "Rent",
  "category": "rent",
  "totalAmount": 10000,
  "paidBy": "user-id",
  "splitType": "PERCENT",
  "participants": [
    { "userId": "user-id-1", "percent": 40 },
    { "userId": "user-id-2", "percent": 60 }
  ]
}
```

**Get All Expenses**
```http
GET /api/groups/:groupId/expenses
```

### Balances

**Get Raw Balances**
```http
GET /api/groups/:groupId/balances/raw
```

Returns net balance for each user:
- Positive balance = user should receive money
- Negative balance = user owes money

**Get Simplified Balances**
```http
GET /api/groups/:groupId/balances/simplified
```

Returns minimal transactions to settle all debts using greedy algorithm.

## 💡 Key Design Decisions

### 1. Money as Integers
All amounts are stored as integers (smallest currency unit) to avoid floating-point errors.

### 2. Strategy Pattern for Splits
Each split type (EQUAL, EXACT, PERCENT) has its own validation and calculation logic.

### 3. Greedy Balance Simplification
- Separates users into creditors and debtors
- Sorts by magnitude
- Matches largest creditor with largest debtor
- Creates minimal transactions

### 4. Layered Architecture
- **Routes**: Handle HTTP requests/responses
- **Services**: Business logic (split calculations, balance management)
- **Data**: In-memory storage

## 🧪 Testing with cURL

See [API_EXAMPLES.md](API_EXAMPLES.md) for complete test scenarios.

## 🎯 Interview Talking Points

> "I designed a backend-only expense sharing system inspired by Splitwise. I focused on correctness of split logic and balance simplification. I used a strategy pattern for different split types and a greedy algorithm to simplify balances. For demo purposes I used in-memory storage, but the design easily supports a relational database."

**Key highlights:**
- Clean separation of concerns
- Strategy pattern for extensibility
- Greedy algorithm for optimization
- Input validation at every layer
- RESTful API design
- Production-ready error handling

## 📝 Notes

- No authentication (assumes trusted userId)
- In-memory storage (data resets on restart)
- All validation errors return 400 with descriptive messages
- Server errors return 500

## 🔧 Future Enhancements

- Add database (PostgreSQL/MongoDB)
- Implement authentication & authorization
- Add settlement tracking
- Support multiple currencies
- Add expense categories validation
- Implement pagination for large datasets
