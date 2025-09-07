import { AuthService } from '../../../src/services/auth/authService';
import { TestHelpers } from '../../utils/testHelpers';
import { initializeTestConnections } from '../../setup';

describe('AuthService', () => {
  let authService: AuthService;
  let testHelpers: TestHelpers;
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    const { testDbPool } = await initializeTestConnections();
    authService = new AuthService();
    testHelpers = new TestHelpers(testDbPool);
  });

  afterEach(async () => {
    // Clean up created users after each test
    for (const userId of createdUserIds) {
      try {
        await testHelpers.deleteUser(userId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdUserIds = [];
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const user = await testHelpers.createTestUser({
        password: 'password123'
      });
      createdUserIds.push(user.id);

      // Act
      const result = await authService.login({ email: user.email, password: 'password123' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
      expect(result.data.user.email).toBe(user.email);
      expect(result.data.user.id).toBe(user.id);
    });

    it('should fail login with invalid email', async () => {
      // Act
      const result = await authService.login({ email: 'nonexistent@example.com', password: 'password123' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid credentials');
    });

    it('should fail login with invalid password', async () => {
      // Arrange
      const user = await testHelpers.createTestUser({
        password: 'password123'
      });
      createdUserIds.push(user.id);

      // Act
      const result = await authService.login({ email: user.email, password: 'wrongpassword' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid credentials');
    });

    it('should fail login with inactive user', async () => {
      // Arrange
      const user = await testHelpers.createTestUser({
        password: 'password123',
        isActive: false
      });
      createdUserIds.push(user.id);

      // Act
      const result = await authService.login({ email: user.email, password: 'password123' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Account is deactivated');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const refreshToken = testHelpers.generateRefreshToken(user);

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
    });

    it('should fail refresh with invalid token', async () => {
      // Act
      const result = await authService.refreshToken('invalid-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Token refresh failed');
    });

    it('should fail refresh with expired token', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const expiredToken = testHelpers.generateRefreshToken(user);
      
      // Mock expired token by modifying the payload
      const decoded = JSON.parse(Buffer.from(expiredToken.split('.')[1], 'base64').toString());
      decoded.exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredTokenString = Buffer.from(JSON.stringify(decoded)).toString('base64');
      const mockExpiredToken = expiredToken.split('.')[0] + '.' + expiredTokenString + '.' + expiredToken.split('.')[2];

      // Act
      const result = await authService.refreshToken(mockExpiredToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Token refresh failed');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const accessToken = testHelpers.generateAccessToken(user);

      // Act
      const result = await authService.logout(accessToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Logout successful');
    });

    it('should handle logout with invalid token', async () => {
      // Act
      const result = await authService.logout('invalid-token');

      // Assert
      expect(result.success).toBe(true); // Logout should succeed even with invalid token
      expect(result.message).toContain('Logout successful');
    });
  });

  describe('validateToken', () => {
    it('should validate valid access token', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const accessToken = testHelpers.generateAccessToken(user);

      // Act
      const result = await authService.validateToken(accessToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('user');
      expect(result.data.user).toHaveProperty('userId');
      expect(result.data.user).toHaveProperty('email');
    });

    it('should reject invalid token', async () => {
      // Act
      const result = await authService.validateToken('invalid-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid token');
    });

    it('should reject expired token', async () => {
      // Arrange
      const user = await testHelpers.createTestUser();
      createdUserIds.push(user.id);
      const expiredToken = testHelpers.generateAccessToken(user);
      
      // Mock expired token
      const decoded = JSON.parse(Buffer.from(expiredToken.split('.')[1], 'base64').toString());
      decoded.exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredTokenString = Buffer.from(JSON.stringify(decoded)).toString('base64');
      const mockExpiredToken = expiredToken.split('.')[0] + '.' + expiredTokenString + '.' + expiredToken.split('.')[2];

      // Act
      const result = await authService.validateToken(mockExpiredToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid token');
    });
  });
});