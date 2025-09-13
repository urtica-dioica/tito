/**
 * Global Teardown for End-to-End Tests
 * 
 * Cleans up test environment and generates final reports
 */

import fs from 'fs/promises';
import path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up end-to-end test environment...');

  try {
    // Generate final E2E test summary
    if (global.e2eTestConfig) {
      const config = global.e2eTestConfig;
      const endTime = new Date();
      
      console.log('📊 End-to-End Test Summary:');
      console.log(`⏱️ Total Duration: ${endTime.toISOString()}`);
      console.log(`🌐 Target: ${config.baseURL}`);
      console.log(`✅ Setup Status: ${config.isReady ? 'Success' : 'Failed'}`);
      console.log(`👤 Authenticated Users: ${config.authenticatedUsers || 0}`);
      console.log(`🔗 Accessible Endpoints: ${config.accessibleEndpoints || 0}`);
      
      if (config.error) {
        console.log(`❌ Setup Error: ${config.error}`);
      }
    }

    // Clean up temporary files
    console.log('🗑️ Cleaning up temporary files...');
    
    const tempDir = path.join(__dirname, 'temp');
    try {
      await fs.access(tempDir);
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        if (file.endsWith('.tmp') || file.endsWith('.log') || file.endsWith('.e2e')) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
      
      console.log('✅ Temporary files cleaned up');
    } catch (error) {
      // Temp directory doesn't exist, that's fine
      console.log('ℹ️ No temporary files to clean up');
    }

    // Clean up test data created during E2E tests
    console.log('🧹 Cleaning up test data...');
    
    const testDataDir = path.join(__dirname, 'test-data');
    try {
      await fs.access(testDataDir);
      const files = await fs.readdir(testDataDir);
      
      for (const file of files) {
        if (file.startsWith('e2e-test-') || file.endsWith('.test-data')) {
          await fs.unlink(path.join(testDataDir, file));
        }
      }
      
      console.log('✅ Test data cleaned up');
    } catch (error) {
      // Test data directory doesn't exist, that's fine
      console.log('ℹ️ No test data to clean up');
    }

    // Generate E2E test completion report
    const completionReport = {
      timestamp: new Date().toISOString(),
      status: 'completed',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      configuration: global.e2eTestConfig || null,
      testResults: {
        totalTests: 0, // This would be populated by actual test results
        passed: 0,
        failed: 0,
        duration: 0
      }
    };

    const reportPath = path.join(__dirname, 'e2e-test-completion.json');
    await fs.writeFile(reportPath, JSON.stringify(completionReport, null, 2));
    
    console.log(`📄 Completion report saved: ${reportPath}`);
    console.log('✅ End-to-end test environment cleanup completed');

  } catch (error) {
    console.error('❌ End-to-end test teardown failed:', error);
    // Don't throw error to avoid masking test results
  }
}

