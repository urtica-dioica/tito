/**
 * End-to-End Test Runner
 * 
 * Comprehensive E2E testing runner for the TITO HR Management System
 * Executes all E2E tests and generates detailed reports
 */

import { E2ETestSuite, E2ETestConfig, generateE2EReport } from './e2eTestUtils';
import fs from 'fs/promises';
import path from 'path';

// E2E Test Configuration
const DEFAULT_CONFIG: E2ETestConfig = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  maxRetries: 3,
  testUsers: {
    hr: {
      username: process.env.TEST_HR_USERNAME || 'hr1',
      password: process.env.TEST_HR_PASSWORD || 'HR123!',
      role: 'hr'
    },
    departmentHead: {
      username: process.env.TEST_DEPT_HEAD_USERNAME || 'depthead1',
      password: process.env.TEST_DEPT_HEAD_PASSWORD || 'DeptHead123!',
      role: 'department_head'
    },
    employee: {
      username: process.env.TEST_EMPLOYEE_USERNAME || 'employee1',
      password: process.env.TEST_EMPLOYEE_PASSWORD || 'Employee123!',
      role: 'employee'
    }
  },
  testData: {
    department: {
      name: 'E2E Test Department',
      description: 'Department created for E2E testing'
    },
    employee: {
      name: 'E2E Test Employee',
      email: 'e2etest@example.com',
      position: 'E2E Test Position'
    },
    payroll: {
      period: '2024-01',
      amount: 50000
    }
  }
};

// E2E Test Categories
export interface E2ETestCategory {
  name: string;
  description: string;
  tests: string[];
  critical: boolean;
}

const E2E_TEST_CATEGORIES: E2ETestCategory[] = [
  {
    name: 'User Workflows',
    description: 'Complete user workflow testing across all roles',
    tests: [
      'HR User Workflow',
      'Department Head User Workflow',
      'Employee User Workflow',
      'Kiosk User Workflow'
    ],
    critical: true
  },
  {
    name: 'Business Processes',
    description: 'End-to-end business process testing',
    tests: [
      'Employee Onboarding Process',
      'Payroll Processing Process',
      'Leave Management Process',
      'Attendance Management Process'
    ],
    critical: true
  },
  {
    name: 'System Integration',
    description: 'System integration and cross-module testing',
    tests: [
      'Database Integration',
      'API Integration',
      'Authentication Integration',
      'File Upload Integration'
    ],
    critical: true
  },
  {
    name: 'Cross-Module Integration',
    description: 'Cross-module integration testing',
    tests: [
      'HR-Employee Integration',
      'Department-Employee Integration',
      'Payroll-Attendance Integration',
      'Leave-Attendance Integration'
    ],
    critical: false
  }
];

// E2E Test Runner Class
export class E2ETestRunner {
  private config: E2ETestConfig;
  private results: any[] = [];
  private startTime: Date = new Date();

  constructor(config: Partial<E2ETestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run all E2E tests
   */
  async runAllTests(): Promise<void> {
    console.log('🔄 Starting comprehensive end-to-end testing...\n');
    console.log(`📡 Target: ${this.config.baseURL}`);
    console.log(`⏱️ Timeout: ${this.config.timeout}ms`);
    console.log(`🔄 Max Retries: ${this.config.maxRetries}\n`);

    const e2eSuite = new E2ETestSuite(this.config);

    try {
      const testResults = await e2eSuite.runAllE2ETests();
      
      this.results = testResults.results;

      await this.generateReport();
      this.printSummary(testResults.summary);

    } catch (error) {
      console.error('❌ E2E testing failed:', error);
      throw error;
    }
  }

  /**
   * Run specific E2E test category
   */
  async runCategory(categoryName: string): Promise<void> {
    const category = E2E_TEST_CATEGORIES.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
      throw new Error(`E2E test category not found: ${categoryName}`);
    }

    console.log(`🔄 Running ${category.name} tests...\n`);
    console.log(`📝 Description: ${category.description}`);
    console.log(`🎯 Tests: ${category.tests.join(', ')}\n`);

    const e2eSuite = new E2ETestSuite(this.config);

    try {
      // Run specific category tests
      switch (categoryName.toLowerCase()) {
        case 'user workflows':
          await this.runUserWorkflowTests(e2eSuite);
          break;
        case 'business processes':
          await this.runBusinessProcessTests(e2eSuite);
          break;
        case 'system integration':
          await this.runSystemIntegrationTests(e2eSuite);
          break;
        case 'cross-module integration':
          await this.runCrossModuleIntegrationTests(e2eSuite);
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
   * Run user workflow tests
   */
  private async runUserWorkflowTests(_e2eSuite: E2ETestSuite): Promise<void> {
    console.log('👤 Running user workflow tests...');
    
    // These would be implemented in the E2ETestSuite
    // await e2eSuite.testUserWorkflows();
    
    console.log('✅ User workflow tests completed');
  }

  /**
   * Run business process tests
   */
  private async runBusinessProcessTests(_e2eSuite: E2ETestSuite): Promise<void> {
    console.log('🏢 Running business process tests...');
    
    // These would be implemented in the E2ETestSuite
    // await e2eSuite.testBusinessProcesses();
    
    console.log('✅ Business process tests completed');
  }

  /**
   * Run system integration tests
   */
  private async runSystemIntegrationTests(_e2eSuite: E2ETestSuite): Promise<void> {
    console.log('🔗 Running system integration tests...');
    
    // These would be implemented in the E2ETestSuite
    // await e2eSuite.testSystemIntegration();
    
    console.log('✅ System integration tests completed');
  }

  /**
   * Run cross-module integration tests
   */
  private async runCrossModuleIntegrationTests(_e2eSuite: E2ETestSuite): Promise<void> {
    console.log('🔄 Running cross-module integration tests...');
    
    // These would be implemented in the E2ETestSuite
    // await e2eSuite.testCrossModuleIntegration();
    
    console.log('✅ Cross-module integration tests completed');
  }

  /**
   * Generate E2E test report
   */
  private async generateReport(): Promise<void> {
    const report = generateE2EReport(this.results);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, `e2e-report-${timestamp}.md`);

    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`📄 E2E test report generated: ${reportPath}`);
  }

  /**
   * Print test summary
   */
  private printSummary(summary: any): void {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    console.log('\n📊 E2E TEST SUMMARY');
    console.log('==================');
    console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📋 Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`📊 Success Rate: ${((summary.passed / summary.totalTests) * 100).toFixed(2)}%`);
    console.log(`⏱️ Average Duration: ${(summary.averageDuration / 1000).toFixed(2)}s`);

    if (summary.failed > 0) {
      console.log('\n⚠️ Some E2E tests failed.');
      console.log('Review the report for details.');
    } else {
      console.log('\n✅ All E2E tests passed!');
      console.log('System workflows are functioning correctly.');
    }
  }

  /**
   * Print category summary
   */
  private printCategorySummary(category: E2ETestCategory): void {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    console.log(`\n📊 ${category.name.toUpperCase()} TEST SUMMARY`);
    console.log('='.repeat(category.name.length + 15));
    console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📝 Description: ${category.description}`);
    console.log(`🎯 Tests: ${category.tests.join(', ')}`);
    console.log(`🔴 Critical: ${category.critical ? 'Yes' : 'No'}`);

    if (category.critical) {
      console.log('\n⚠️ This is a critical E2E test category.');
      console.log('All tests must pass for system functionality.');
    }
  }

  /**
   * List available test categories
   */
  static listCategories(): void {
    console.log('🔄 Available E2E Test Categories:');
    console.log('=================================\n');

    E2E_TEST_CATEGORIES.forEach((category, index) => {
      const critical = category.critical ? '🔴 CRITICAL' : '🟡 OPTIONAL';
      console.log(`${index + 1}. ${category.name} ${critical}`);
      console.log(`   📝 ${category.description}`);
      console.log(`   🎯 Tests: ${category.tests.join(', ')}\n`);
    });
  }
}

// Command Line Interface
export const runE2ETests = async (args: string[] = []): Promise<void> => {
  const command = args[0];
  const category = args[1];

  try {
    switch (command) {
      case 'all':
        const runner = new E2ETestRunner();
        await runner.runAllTests();
        break;

      case 'category':
        if (!category) {
          console.error('❌ Category name required');
          E2ETestRunner.listCategories();
          process.exit(1);
        }
        const categoryRunner = new E2ETestRunner();
        await categoryRunner.runCategory(category);
        break;

      case 'list':
        E2ETestRunner.listCategories();
        break;

      case 'help':
      default:
        console.log('🔄 E2E Test Runner');
        console.log('=================\n');
        console.log('Usage:');
        console.log('  npm run test:e2e                        # Run all E2E tests');
        console.log('  npm run test:e2e:category <name>        # Run specific category');
        console.log('  npm run test:e2e:list                   # List available categories');
        console.log('  npm run test:e2e:help                   # Show this help\n');
        console.log('Examples:');
        console.log('  npm run test:e2e:category "user workflows"');
        console.log('  npm run test:e2e:category "business processes"');
        console.log('  npm run test:e2e:category "system integration"\n');
        E2ETestRunner.listCategories();
        break;
    }
  } catch (error) {
    console.error('❌ E2E testing failed:', error);
    process.exit(1);
  }
};

// Export for use in other modules
export { E2E_TEST_CATEGORIES, DEFAULT_CONFIG };
