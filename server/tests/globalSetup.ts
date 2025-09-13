/**
 * Global Test Setup
 * 
 * This file runs once before all tests start.
 * It sets up the global test environment and initializes any required services.
 */

import { setupTestDatabase, setupTestRedis } from './setup';

export default async function globalSetup() {
  console.log('🚀 Setting up global test environment...');
  
  try {
    // Setup test database
    console.log('📊 Setting up test database...');
    await setupTestDatabase();
    console.log('✅ Test database setup complete');
    
    // Setup test Redis (mock)
    console.log('🔴 Setting up test Redis (mock)...');
    await setupTestRedis();
    console.log('✅ Test Redis setup complete');
    
    console.log('🎉 Global test setup complete!');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}

