/**
 * Global Teardown for Security Tests
 * 
 * Cleans up test environment and generates final reports
 */

import fs from 'fs/promises';
import path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up security test environment...');

  try {
    // Generate final security test summary
    if (global.securityTestConfig) {
      const config = global.securityTestConfig;
      const endTime = new Date();
      
      console.log('📊 Security Test Summary:');
      console.log(`⏱️ Total Duration: ${endTime.toISOString()}`);
      console.log(`🌐 Target: ${config.baseURL}`);
      console.log(`✅ Setup Status: ${config.isReady ? 'Success' : 'Failed'}`);
      
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
        if (file.endsWith('.tmp') || file.endsWith('.log')) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
      
      console.log('✅ Temporary files cleaned up');
    } catch (error) {
      // Temp directory doesn't exist, that's fine
      console.log('ℹ️ No temporary files to clean up');
    }

    // Generate security test completion report
    const completionReport = {
      timestamp: new Date().toISOString(),
      status: 'completed',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      configuration: global.securityTestConfig || null
    };

    const reportPath = path.join(__dirname, 'security-test-completion.json');
    await fs.writeFile(reportPath, JSON.stringify(completionReport, null, 2));
    
    console.log(`📄 Completion report saved: ${reportPath}`);
    console.log('✅ Security test environment cleanup completed');

  } catch (error) {
    console.error('❌ Security test teardown failed:', error);
    // Don't throw error to avoid masking test results
  }
}

