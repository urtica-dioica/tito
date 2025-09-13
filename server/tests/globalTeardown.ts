/**
 * Global Test Teardown
 * 
 * This file runs once after all tests complete.
 * It cleans up the global test environment and any resources.
 */

import { cleanupTestDatabase, cleanupTestRedis } from './setup';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up global test environment...');
  
  try {
    // Cleanup test Redis
    console.log('🔴 Cleaning up test Redis...');
    await cleanupTestRedis();
    console.log('✅ Test Redis cleanup complete');
    
    // Cleanup test database
    console.log('📊 Cleaning up test database...');
    await cleanupTestDatabase();
    console.log('✅ Test database cleanup complete');
    
    console.log('🎉 Global test teardown complete!');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

