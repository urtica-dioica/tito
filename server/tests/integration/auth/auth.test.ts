import request from 'supertest';
import app from '../../../src/app';
import { TestHelpers } from '../../utils/testHelpers';
import { initializeTestConnections, cleanupTestDatabase, cleanupTestRedis } from '../../setup';

describe('Authentication API Integration Tests', () => {
  let testHelpers: TestHelpers;
  let testDbPool: any;
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    const { testDbPool: pool } = await initializeTestConnections();
    testDbPool = pool;
    testHelpers = new TestHelpers(testDbPool);
  });

  afterEach(async () => {
    // Clean up created users after each test
    for (const userId of createdUserIds) {
      try {
        await testDbPool.query('DELETE FROM users WHERE id = $1', [userId]);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdUserIds = [];
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await cleanupTestRedis();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const user = await testHelpers.createTestUser({
        password: 'password123'
      });
      createdUserIds.push(user.id);

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.id).toBe(user.id);
    });

    it('should fail login with invalid email', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail login with invalid password', async () => {
      // Arrange
      const user = await testHelpers.createTestUser({
        password: 'password123'
      });
      createdUserIds.push(user.id);

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail login with missing email', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email and password are required');
    });

    it('should fail login with missing password', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email and password are required');
    });

    it('should fail login with inactive user', async () => {
      // Arrange
      const user = await testHelpers.createTestUser({
        password: 'password123',
        isActive: false
      });
      createdUserIds.push(user.id);

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Account is deactivated');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const refreshToken = testHelpers.generateRefreshToken(user);

      // Act
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail refresh with invalid token', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: 'invalid-token'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token refresh failed');
    });

    it('should fail refresh with missing token', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token is required');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should successfully logout with valid access token', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const accessToken = testHelpers.generateAccessToken(user);

      // Act
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should fail logout without token', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/logout');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });

    it('should fail logout with invalid token', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Protected Route Access', () => {
    it('should allow access to protected route with valid token', async () => {
      // Arrange
      const user = await testHelpers.createTestUser({ role: 'hr' });
      createdUserIds.push(user.id);
      const accessToken = testHelpers.generateAccessToken(user);

      // Act
      const response = await request(app)
        .get('/api/v1/hr/employees')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access to protected route without token', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/hr/employees');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });

    it('should deny access to protected route with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/hr/employees')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });
});