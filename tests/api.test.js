/**
 * API Tests - Core functionality tests for placement demonstration
 * Demonstrates testing skills and code quality awareness
 */

const request = require('supertest');
const app = require('../index');

describe('Splitwise API Tests', () => {
  let userId1, userId2, userId3;
  let groupId;

  // Test 1: User Creation
  describe('POST /api/users', () => {
    test('should create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Alice' });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Alice');
      userId1 = res.body.id;
    });

    test('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: '' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({});
      
      expect(res.statusCode).toBe(400);
    });
  });

  // Test 2: Group Creation
  describe('POST /api/groups', () => {
    beforeAll(async () => {
      // Create users for group tests
      const res1 = await request(app).post('/api/users').send({ name: 'Bob' });
      const res2 = await request(app).post('/api/users').send({ name: 'Charlie' });
      userId2 = res1.body.id;
      userId3 = res2.body.id;
    });

    test('should create a new group', async () => {
      const res = await request(app)
        .post('/api/groups')
        .send({ 
          name: 'Trip to Goa',
          createdBy: userId1 
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Trip to Goa');
      expect(res.body.members).toContain(userId1);
      groupId = res.body.id;
    });

    test('should reject invalid user', async () => {
      const res = await request(app)
        .post('/api/groups')
        .send({ 
          name: 'Test Group',
          createdBy: 'invalid-user-id' 
        });
      
      expect(res.statusCode).toBe(400);
    });
  });

  // Test 3: Add Member
  describe('POST /api/groups/:groupId/members', () => {
    test('should add member to group', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .send({ userId: userId2 });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.members).toContain(userId2);
    });

    test('should reject duplicate member', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .send({ userId: userId2 });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('already a member');
    });
  });

  // Test 4: Equal Split Expense
  describe('POST /api/groups/:groupId/expenses - EQUAL split', () => {
    test('should create equal split expense', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/expenses`)
        .send({
          description: 'Dinner',
          category: 'food',
          totalAmount: 3000,
          paidBy: userId1,
          splitType: 'EQUAL',
          participants: [userId1, userId2]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.totalAmount).toBe(3000);
      expect(res.body.splits).toHaveLength(2);
      expect(res.body.splits[0].amount).toBe(1500);
      expect(res.body.splits[1].amount).toBe(1500);
    });

    test('should reject invalid split type', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/expenses`)
        .send({
          description: 'Test',
          category: 'food',
          totalAmount: 1000,
          paidBy: userId1,
          splitType: 'INVALID',
          participants: [userId1]
        });
      
      expect(res.statusCode).toBe(400);
    });
  });

  // Test 5: EXACT Split Expense
  describe('POST /api/groups/:groupId/expenses - EXACT split', () => {
    test('should create exact split expense', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/expenses`)
        .send({
          description: 'Shopping',
          category: 'shopping',
          totalAmount: 5000,
          paidBy: userId2,
          splitType: 'EXACT',
          participants: [
            { userId: userId1, amount: 2000 },
            { userId: userId2, amount: 3000 }
          ]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.splits).toHaveLength(2);
    });

    test('should reject mismatched exact amounts', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/expenses`)
        .send({
          description: 'Test',
          category: 'food',
          totalAmount: 1000,
          paidBy: userId1,
          splitType: 'EXACT',
          participants: [
            { userId: userId1, amount: 500 },
            { userId: userId2, amount: 400 } // Sum = 900, not 1000
          ]
        });
      
      expect(res.statusCode).toBe(400);
    });
  });

  // Test 6: Balance Calculation
  describe('GET /api/groups/:groupId/balances', () => {
    test('should get raw balances', async () => {
      const res = await request(app)
        .get(`/api/groups/${groupId}/balances/raw`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('balances');
    });

    test('should get simplified balances', async () => {
      const res = await request(app)
        .get(`/api/groups/${groupId}/balances/simplified`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('transactions');
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });
  });

  // Test 7: 404 Handling
  describe('404 Error Handling', () => {
    test('should return 404 for invalid route', async () => {
      const res = await request(app).get('/api/invalid-route');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    test('should return 404 for non-existent group', async () => {
      const res = await request(app).get('/api/groups/invalid-id');
      expect(res.statusCode).toBe(404);
    });
  });

  // Test 8: API Info
  describe('GET /api/info', () => {
    test('should return API information', async () => {
      const res = await request(app).get('/api/info');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('endpoints');
    });
  });

  // Test 9: Reset Data
  describe('DELETE /api/reset', () => {
    test('should reset all data', async () => {
      const res = await request(app).delete('/api/reset');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset');
    });

    test('should have empty data after reset', async () => {
      await request(app).delete('/api/reset');
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });
});
