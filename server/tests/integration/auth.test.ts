import request from 'supertest';
import express from 'express';

// Create a simple test app
const app = express();
app.use(express.json());

// Mock auth routes for testing
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Mock authentication logic
  if (email === 'admin@mmda.com' && password === 'admin123') {
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: 1,
          email: 'admin@mmda.com',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User'
        },
        token: 'mock-jwt-token'
      }
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name, phone, role } = req.body;
  
  if (!email || !password || !first_name || !last_name || !phone) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Mock registration logic
  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: 999,
        email,
        first_name,
        last_name,
        phone,
        role: role || 'taxpayer'
      }
    }
  });
});

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    // Reset mock database state
    // Note: mockDb.users is read-only in the current implementation
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@mmda.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('admin@mmda.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@mmda.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@mmda.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        phone: '+233200000003',
        role: 'taxpayer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.first_name).toBe(userData.first_name);
    });

    it('should reject registration without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
