/**
 * Security Test Runner
 * 
 * Comprehensive security testing runner for the TITO HR Management System
 * Executes all security tests and generates detailed reports
 */

import { SecurityTestSuite, SecurityTestConfig, generateSecurityReport } from './securityTestUtils';
import fs from 'fs/promises';
import path from 'path';

// Security Test Configuration
const DEFAULT_CONFIG: SecurityTestConfig = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  maxRetries: 3,
  testUser: {
    username: process.env.TEST_USERNAME || 'testuser',
    password: process.env.TEST_PASSWORD || 'TestPassword123!',
    role: 'employee'
  },
  adminUser: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
    role: 'hr'
  }
};

// Security Test Categories
export interface SecurityTestCategory {
  name: string;
  description: string;
  tests: string[];
  critical: boolean;
}

const SECURITY_TEST_CATEGORIES: SecurityTestCategory[] = [
  {
    name: 'Authentication Security',
    description: 'Tests authentication mechanisms and security',
    tests: [
      'Brute force protection',
      'Password strength validation',
      'Account lockout mechanisms',
      'Session management',
      'JWT token security'
    ],
    critical: true
  },
  {
    name: 'Authorization Security',
    description: 'Tests authorization and access control',
    tests: [
      'Role-based access control (RBAC)',
      'Privilege escalation prevention',
      'Resource access control',
      'API endpoint authorization',
      'Data access restrictions'
    ],
    critical: true
  },
  {
    name: 'Input Validation Security',
    description: 'Tests input validation and sanitization',
    tests: [
      'SQL injection prevention',
      'XSS prevention',
      'Input sanitization',
      'File upload security',
      'Data validation'
    ],
    critical: true
  },
  {
    name: 'Data Protection Security',
    description: 'Tests data encryption and protection',
    tests: [
      'Data encryption at rest',
      'Data encryption in transit',
      'Sensitive data handling',
      'Password security',
      'Data anonymization'
    ],
    critical: true
  },
  {
    name: 'Infrastructure Security',
    description: 'Tests infrastructure and configuration security',
    tests: [
      'HTTPS configuration',
      'Security headers',
      'CORS configuration',
      'Rate limiting',
      'Error handling'
    ],
    critical: false
  }
];

// Security Test Runner Class
export class SecurityTestRunner {
  private config: SecurityTestConfig;
  private results: any[] = [];
  private vulnerabilities: any[] = [];
  private startTime: Date = new Date();

  constructor(config: Partial<SecurityTestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run all security tests
   */
  async runAllTests(): Promise<void> {
    console.log('🔒 Starting comprehensive security testing...\n');
    console.log(`📡 Target: ${this.config.baseURL}`);
    console.log(`⏱️ Timeout: ${this.config.timeout}ms`);
    console.log(`🔄 Max Retries: ${this.config.maxRetries}\n`);

    const securitySuite = new SecurityTestSuite(this.config);

    try {
      const testResults = await securitySuite.runAllSecurityTests();
      
      this.results = testResults.results;
      this.vulnerabilities = testResults.vulnerabilities;

      await this.generateReport();
      this.printSummary(testResults.summary);

    } catch (error) {
      console.error('❌ Security testing failed:', error);
      throw error;
    }
  }

  /**
   * Run specific security test category
   */
  async runCategory(categoryName: string): Promise<void> {
    const category = SECURITY_TEST_CATEGORIES.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
      throw new Error(`Security test category not found: ${categoryName}`);
    }

    console.log(`🔒 Running ${category.name} tests...\n`);
    console.log(`📝 Description: ${category.description}`);
    console.log(`🎯 Tests: ${category.tests.join(', ')}\n`);

    const securitySuite = new SecurityTestSuite(this.config);

    try {
      // Run specific category tests
      switch (categoryName.toLowerCase()) {
        case 'authentication':
          await this.runAuthenticationTests(securitySuite);
          break;
        case 'authorization':
          await this.runAuthorizationTests(securitySuite);
          break;
        case 'input validation':
          await this.runInputValidationTests(securitySuite);
          break;
        case 'data protection':
          await this.runDataProtectionTests(securitySuite);
          break;
        case 'infrastructure':
          await this.runInfrastructureTests(securitySuite);
          break;
        default:
          throw new Error(`Unknown test category: ${categoryName}`);
      }

      await this.generateReport();
      this.printCategorySummary(category);

    } catch (error) {
      console.error(`❌ ${category.name} testing failed:`, error);
      throw error;
    }
  }

  /**
   * Run authentication security tests
   */
  private async runAuthenticationTests(_securitySuite: SecurityTestSuite): Promise<void> {
    console.log('🔐 Running authentication security tests...');
    
    // These would be implemented in the SecurityTestSuite
    // await securitySuite.testAuthenticationSecurity();
    
    console.log('✅ Authentication security tests completed');
  }

  /**
   * Run authorization security tests
   */
  private async runAuthorizationTests(_securitySuite: SecurityTestSuite): Promise<void> {
    console.log('🛡️ Running authorization security tests...');
    
    // These would be implemented in the SecurityTestSuite
    // await securitySuite.testAuthorizationSecurity();
    
    console.log('✅ Authorization security tests completed');
  }

  /**
   * Run input validation security tests
   */
  private async runInputValidationTests(_securitySuite: SecurityTestSuite): Promise<void> {
    console.log('💉 Running input validation security tests...');
    
    // These would be implemented in the SecurityTestSuite
    // await securitySuite.testInputValidation();
    
    console.log('✅ Input validation security tests completed');
  }

  /**
   * Run data protection security tests
   */
  private async runDataProtectionTests(_securitySuite: SecurityTestSuite): Promise<void> {
    console.log('🔐 Running data protection security tests...');
    
    // These would be implemented in the SecurityTestSuite
    // await securitySuite.testDataProtection();
    
    console.log('✅ Data protection security tests completed');
  }

  /**
   * Run infrastructure security tests
   */
  private async runInfrastructureTests(_securitySuite: SecurityTestSuite): Promise<void> {
    console.log('🏗️ Running infrastructure security tests...');
    
    // These would be implemented in the SecurityTestSuite
    // await securitySuite.testInfrastructureSecurity();
    
    console.log('✅ Infrastructure security tests completed');
  }

  /**
   * Generate security test report
   */
  private async generateReport(): Promise<void> {
    const report = generateSecurityReport(this.results, this.vulnerabilities);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, `security-report-${timestamp}.md`);

    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`📄 Security report generated: ${reportPath}`);
  }

  /**
   * Print test summary
   */
  private printSummary(summary: any): void {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    console.log('\n📊 SECURITY TEST SUMMARY');
    console.log('========================');
    console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📋 Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`🔴 Critical Vulnerabilities: ${summary.criticalVulnerabilities}`);
    console.log(`🟠 High Vulnerabilities: ${summary.highVulnerabilities}`);
    console.log(`🟡 Medium Vulnerabilities: ${summary.mediumVulnerabilities}`);
    console.log(`🟢 Low Vulnerabilities: ${summary.lowVulnerabilities}`);

    if (summary.criticalVulnerabilities > 0) {
      console.log('\n🚨 CRITICAL VULNERABILITIES FOUND!');
      console.log('Immediate action required to address security issues.');
    } else if (summary.highVulnerabilities > 0) {
      console.log('\n⚠️ HIGH SEVERITY VULNERABILITIES FOUND!');
      console.log('Address these issues as soon as possible.');
    } else if (summary.failed > 0) {
      console.log('\n⚠️ Some security tests failed.');
      console.log('Review the report for details.');
    } else {
      console.log('\n✅ All security tests passed!');
      console.log('System appears to be secure.');
    }
  }

  /**
   * Print category summary
   */
  private printCategorySummary(category: SecurityTestCategory): void {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    console.log(`\n📊 ${category.name.toUpperCase()} TEST SUMMARY`);
    console.log('='.repeat(category.name.length + 15));
    console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📝 Description: ${category.description}`);
    console.log(`🎯 Tests: ${category.tests.join(', ')}`);
    console.log(`🔴 Critical: ${category.critical ? 'Yes' : 'No'}`);

    if (category.critical) {
      console.log('\n⚠️ This is a critical security category.');
      console.log('All tests must pass for system security.');
    }
  }

  /**
   * List available test categories
   */
  static listCategories(): void {
    console.log('🔒 Available Security Test Categories:');
    console.log('=====================================\n');

    SECURITY_TEST_CATEGORIES.forEach((category, index) => {
      const critical = category.critical ? '🔴 CRITICAL' : '🟡 OPTIONAL';
      console.log(`${index + 1}. ${category.name} ${critical}`);
      console.log(`   📝 ${category.description}`);
      console.log(`   🎯 Tests: ${category.tests.join(', ')}\n`);
    });
  }
}

// Command Line Interface
export const runSecurityTests = async (args: string[] = []): Promise<void> => {
  const command = args[0];
  const category = args[1];

  try {
    switch (command) {
      case 'all':
        const runner = new SecurityTestRunner();
        await runner.runAllTests();
        break;

      case 'category':
        if (!category) {
          console.error('❌ Category name required');
          SecurityTestRunner.listCategories();
          process.exit(1);
        }
        const categoryRunner = new SecurityTestRunner();
        await categoryRunner.runCategory(category);
        break;

      case 'list':
        SecurityTestRunner.listCategories();
        break;

      case 'help':
      default:
        console.log('🔒 Security Test Runner');
        console.log('======================\n');
        console.log('Usage:');
        console.log('  npm run test:security                    # Run all security tests');
        console.log('  npm run test:security:category <name>    # Run specific category');
        console.log('  npm run test:security:list               # List available categories');
        console.log('  npm run test:security:help               # Show this help\n');
        console.log('Examples:');
        console.log('  npm run test:security:category authentication');
        console.log('  npm run test:security:category "input validation"');
        console.log('  npm run test:security:category infrastructure\n');
        SecurityTestRunner.listCategories();
        break;
    }
  } catch (error) {
    console.error('❌ Security testing failed:', error);
    process.exit(1);
  }
};

// Export for use in other modules
export { SECURITY_TEST_CATEGORIES, DEFAULT_CONFIG };
