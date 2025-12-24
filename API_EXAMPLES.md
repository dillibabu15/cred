# API Test Examples

Complete test scenario using cURL commands. Run these in order to see the system in action.

## Setup

Make sure the server is running:
```bash
npm start
```

## Test Scenario: Trip to Goa

### Step 1: Create Users

```bash
# Create Alice
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Alice\"}"

# Response: {"id": "alice-id", "name": "Alice"}
# Save the ID as ALICE_ID

# Create Bob
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Bob\"}"

# Save the ID as BOB_ID

# Create Charlie
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Charlie\"}"

# Save the ID as CHARLIE_ID
```

### Step 2: Create Group

```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Goa Trip 2025\", \"createdBy\": \"ALICE_ID\"}"

# Response: {"id": "group-id", "name": "Goa Trip 2025", ...}
# Save the ID as GROUP_ID
```

### Step 3: Add Members to Group

```bash
# Add Bob
curl -X POST http://localhost:3000/api/groups/GROUP_ID/members \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"BOB_ID\"}"

# Add Charlie
curl -X POST http://localhost:3000/api/groups/GROUP_ID/members \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"CHARLIE_ID\"}"
```

### Step 4: Add Expenses

**Expense 1: Hotel (EQUAL split)**
```bash
curl -X POST http://localhost:3000/api/groups/GROUP_ID/expenses \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Hotel booking\",
    \"category\": \"trip\",
    \"totalAmount\": 6000,
    \"paidBy\": \"ALICE_ID\",
    \"splitType\": \"EQUAL\",
    \"participants\": [\"ALICE_ID\", \"BOB_ID\", \"CHARLIE_ID\"]
  }"
```

**Expense 2: Dinner (EXACT split)**
```bash
curl -X POST http://localhost:3000/api/groups/GROUP_ID/expenses \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Dinner at beach restaurant\",
    \"category\": \"food\",
    \"totalAmount\": 3000,
    \"paidBy\": \"BOB_ID\",
    \"splitType\": \"EXACT\",
    \"participants\": [
      {\"userId\": \"ALICE_ID\", \"amount\": 1000},
      {\"userId\": \"BOB_ID\", \"amount\": 1200},
      {\"userId\": \"CHARLIE_ID\", \"amount\": 800}
    ]
  }"
```

**Expense 3: Cab fare (PERCENT split)**
```bash
curl -X POST http://localhost:3000/api/groups/GROUP_ID/expenses \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Cab to airport\",
    \"category\": \"trip\",
    \"totalAmount\": 2000,
    \"paidBy\": \"CHARLIE_ID\",
    \"splitType\": \"PERCENT\",
    \"participants\": [
      {\"userId\": \"ALICE_ID\", \"percent\": 40},
      {\"userId\": \"BOB_ID\", \"percent\": 30},
      {\"userId\": \"CHARLIE_ID\", \"percent\": 30}
    ]
  }"
```

### Step 5: Check Balances

**Raw Balances**
```bash
curl http://localhost:3000/api/groups/GROUP_ID/balances/raw
```

**Expected Output:**
```json
{
  "groupId": "GROUP_ID",
  "balances": {
    "ALICE_ID": 3000,    // Alice paid 6000, owes 3800 → net +3000
    "BOB_ID": -200,      // Bob paid 3000, owes 2800 → net -200
    "CHARLIE_ID": -2800  // Charlie paid 2000, owes 4800 → net -2800
  }
}
```

**Simplified Balances**
```bash
curl http://localhost:3000/api/groups/GROUP_ID/balances/simplified
```

**Expected Output:**
```json
{
  "groupId": "GROUP_ID",
  "transactions": [
    {
      "from": "CHARLIE_ID",
      "to": "ALICE_ID",
      "amount": 2800
    },
    {
      "from": "BOB_ID",
      "to": "ALICE_ID",
      "amount": 200
    }
  ],
  "count": 2
}
```

### Step 6: View All Expenses

```bash
curl http://localhost:3000/api/groups/GROUP_ID/expenses
```

## Testing Error Cases

### Invalid Split - Exact sum doesn't match total

```bash
curl -X POST http://localhost:3000/api/groups/GROUP_ID/expenses \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Invalid expense\",
    \"category\": \"food\",
    \"totalAmount\": 3000,
    \"paidBy\": \"ALICE_ID\",
    \"splitType\": \"EXACT\",
    \"participants\": [
      {\"userId\": \"ALICE_ID\", \"amount\": 1000},
      {\"userId\": \"BOB_ID\", \"amount\": 1500}
    ]
  }"

# Expected: 400 error - "Sum of shares (2500) must equal total amount (3000)"
```

### Invalid Split - Percent doesn't equal 100

```bash
curl -X POST http://localhost:3000/api/groups/GROUP_ID/expenses \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Invalid expense\",
    \"category\": \"food\",
    \"totalAmount\": 1000,
    \"paidBy\": \"ALICE_ID\",
    \"splitType\": \"PERCENT\",
    \"participants\": [
      {\"userId\": \"ALICE_ID\", \"percent\": 50},
      {\"userId\": \"BOB_ID\", \"percent\": 30}
    ]
  }"

# Expected: 400 error - "Sum of percentages (80) must equal 100"
```

### Non-member trying to add expense

```bash
# Create a user not in the group
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Dave\"}"

# Try to create expense with Dave as payer
curl -X POST http://localhost:3000/api/groups/GROUP_ID/expenses \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Unauthorized expense\",
    \"category\": \"food\",
    \"totalAmount\": 1000,
    \"paidBy\": \"DAVE_ID\",
    \"splitType\": \"EQUAL\",
    \"participants\": [\"DAVE_ID\"]
  }"

# Expected: 400 error - "Payer must be a member of the group"
```

## PowerShell Examples (Windows)

If using PowerShell, use these commands instead:

```powershell
# Create user
Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name": "Alice"}'

# Create group
Invoke-RestMethod -Uri "http://localhost:3000/api/groups" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name": "Goa Trip 2025", "createdBy": "ALICE_ID"}'

# Get balances
Invoke-RestMethod -Uri "http://localhost:3000/api/groups/GROUP_ID/balances/simplified"
```

## Quick Test Script

Save this as `test.sh` for quick testing:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

# Create users
echo "Creating users..."
ALICE=$(curl -s -X POST $BASE_URL/users -H "Content-Type: application/json" -d '{"name":"Alice"}' | jq -r '.id')
BOB=$(curl -s -X POST $BASE_URL/users -H "Content-Type: application/json" -d '{"name":"Bob"}' | jq -r '.id')
CHARLIE=$(curl -s -X POST $BASE_URL/users -H "Content-Type: application/json" -d '{"name":"Charlie"}' | jq -r '.id')

echo "Alice: $ALICE"
echo "Bob: $BOB"
echo "Charlie: $CHARLIE"

# Create group
echo -e "\nCreating group..."
GROUP=$(curl -s -X POST $BASE_URL/groups -H "Content-Type: application/json" -d "{\"name\":\"Test Group\",\"createdBy\":\"$ALICE\"}" | jq -r '.id')
echo "Group: $GROUP"

# Add members
echo -e "\nAdding members..."
curl -s -X POST $BASE_URL/groups/$GROUP/members -H "Content-Type: application/json" -d "{\"userId\":\"$BOB\"}" > /dev/null
curl -s -X POST $BASE_URL/groups/$GROUP/members -H "Content-Type: application/json" -d "{\"userId\":\"$CHARLIE\"}" > /dev/null

# Add expense
echo -e "\nAdding expense..."
curl -s -X POST $BASE_URL/groups/$GROUP/expenses -H "Content-Type: application/json" \
  -d "{\"description\":\"Test expense\",\"category\":\"food\",\"totalAmount\":3000,\"paidBy\":\"$ALICE\",\"splitType\":\"EQUAL\",\"participants\":[\"$ALICE\",\"$BOB\",\"$CHARLIE\"]}" > /dev/null

# Get balances
echo -e "\nSimplified balances:"
curl -s $BASE_URL/groups/$GROUP/balances/simplified | jq .
```

Run with: `bash test.sh`
