/**
 * Mock Redis Service for Testing
 * 
 * This mock service provides the same interface as the real Redis service
 * but stores data in memory instead of connecting to Redis.
 */

export interface MockRedisData {
  [key: string]: {
    value: string;
    ttl?: number;
    expiresAt?: number;
  };
}

export class MockRedisService {
  private data: MockRedisData = {};
  private isConnected: boolean = true;

  constructor() {
    // Simulate connection delay
    this.connect();
  }

  async connect(): Promise<void> {
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async isRedisConnected(): Promise<boolean> {
    return this.isConnected;
  }

  async getCache(key: string): Promise<string | null> {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }

    const item = this.data[key];
    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      delete this.data[key];
      return null;
    }

    return item.value;
  }

  async setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }

    const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    
    this.data[key] = {
      value,
      ttl: ttlSeconds,
      expiresAt
    };
  }

  async deleteCache(key: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }

    delete this.data[key];
  }

  async flushDb(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }

    this.data = {};
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }

    const item = this.data[key];
    if (!item) {
      return false;
    }

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      delete this.data[key];
      return false;
    }

    return true;
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Object.keys(this.data).filter(key => regex.test(key));
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }

    const item = this.data[key];
    if (!item) {
      return false;
    }

    item.ttl = ttlSeconds;
    item.expiresAt = Date.now() + (ttlSeconds * 1000);
    return true;
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }

    const item = this.data[key];
    if (!item || !item.expiresAt) {
      return -1; // No expiration
    }

    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2; // Expired
  }

  // Test utilities
  getData(): MockRedisData {
    return { ...this.data };
  }

  clearData(): void {
    this.data = {};
  }

  setConnected(connected: boolean): void {
    this.isConnected = connected;
  }

  // Simulate Redis connection issues for testing
  simulateConnectionError(): void {
    this.isConnected = false;
  }

  simulateConnectionRecovery(): void {
    this.isConnected = true;
  }
}

// Singleton instance for tests
export const mockRedisService = new MockRedisService();

// Export for use in tests
export default mockRedisService;

