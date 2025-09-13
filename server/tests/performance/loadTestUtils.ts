// Mock axios for testing
interface AxiosInstance {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  patch: jest.Mock;
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
}

interface AxiosResponse {
  status: number;
  data: any;
}

const axios = {
  create: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })
};
import { performance } from 'perf_hooks';

export interface LoadTestConfig {
  baseURL: string;
  concurrentUsers: number;
  requestsPerUser: number;
  rampUpTime: number; // milliseconds
  testDuration: number; // milliseconds
  timeout: number; // milliseconds
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  startTime: number;
  endTime: number;
  duration: number;
  errors: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
}

export interface RequestMetrics {
  startTime: number;
  endTime: number;
  responseTime: number;
  success: boolean;
  statusCode?: number;
  error?: string;
}

export class LoadTestRunner {
  private axiosInstance: AxiosInstance;
  private config: LoadTestConfig;
  private results: RequestMetrics[] = [];

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.axiosInstance = (axios as any).create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTestRunner/1.0'
      }
    });
  }

  /**
   * Run a load test with a specific request function
   */
  async runLoadTest(
    requestFunction: (axios: AxiosInstance) => Promise<AxiosResponse>,
    testName: string
  ): Promise<LoadTestResult> {
    console.log(`🚀 Starting load test: ${testName}`);
    console.log(`📊 Configuration: ${this.config.concurrentUsers} users, ${this.config.requestsPerUser} requests each`);
    
    this.results = [];
    const startTime = performance.now();

    // Create user groups
    const userGroups = this.createUserGroups();
    
    // Run load test
    await this.executeLoadTest(userGroups, requestFunction);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Calculate results
    const result = this.calculateResults(startTime, endTime, duration);
    
    console.log(`✅ Load test completed: ${testName}`);
    console.log(`📈 Results: ${result.successfulRequests}/${result.totalRequests} successful (${(result.errorRate * 100).toFixed(2)}% error rate)`);
    console.log(`⏱️  Average response time: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`🚀 Requests per second: ${result.requestsPerSecond.toFixed(2)}`);
    
    return result;
  }

  /**
   * Create user groups for concurrent execution
   */
  private createUserGroups(): Array<() => Promise<void>> {
    const userGroups: Array<() => Promise<void>> = [];
    
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      userGroups.push(async () => {
        // Ramp up delay
        const rampUpDelay = (i / this.config.concurrentUsers) * this.config.rampUpTime;
        if (rampUpDelay > 0) {
          await this.sleep(rampUpDelay);
        }
        
        // Execute requests for this user
        for (let j = 0; j < this.config.requestsPerUser; j++) {
          await this.executeRequest();
          
          // Add delay between requests if needed
          if (j < this.config.requestsPerUser - 1) {
            await this.sleep(100); // 100ms between requests
          }
        }
      });
    }
    
    return userGroups;
  }

  /**
   * Execute the load test with all user groups
   */
  private async executeLoadTest(
    userGroups: Array<() => Promise<void>>,
    requestFunction: (axios: AxiosInstance) => Promise<AxiosResponse>
  ): Promise<void> {
    // Store the request function for use in executeRequest
    (this as any).requestFunction = requestFunction;
    
    // Execute all user groups concurrently
    await Promise.all(userGroups.map(userGroup => userGroup()));
  }

  /**
   * Execute a single request and record metrics
   */
  private async executeRequest(): Promise<void> {
    const startTime = performance.now();
    let endTime: number;
    let success = false;
    let statusCode: number | undefined;
    let error: string | undefined;

    try {
      const response = await (this as any).requestFunction(this.axiosInstance);
      endTime = performance.now();
      success = true;
      statusCode = response.status;
    } catch (err: any) {
      endTime = performance.now();
      success = false;
      statusCode = err.response?.status;
      error = err.message || 'Unknown error';
    }

    const responseTime = endTime - startTime;

    this.results.push({
      startTime,
      endTime,
      responseTime,
      success,
      statusCode,
      error
    });
  }

  /**
   * Calculate test results from metrics
   */
  private calculateResults(startTime: number, endTime: number, duration: number): LoadTestResult {
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = this.results.map(r => r.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests;
    const minResponseTime = responseTimes[0] || 0;
    const maxResponseTime = responseTimes[responseTimes.length - 1] || 0;
    const p95ResponseTime = this.percentile(responseTimes, 95);
    const p99ResponseTime = this.percentile(responseTimes, 99);
    
    const requestsPerSecond = totalRequests / (duration / 1000);
    const errorRate = failedRequests / totalRequests;
    
    // Calculate error breakdown
    const errorMap = new Map<string, number>();
    this.results
      .filter(r => !r.success)
      .forEach(r => {
        const errorKey = r.error || `HTTP ${r.statusCode}`;
        errorMap.set(errorKey, (errorMap.get(errorKey) || 0) + 1);
      });
    
    const errors = Array.from(errorMap.entries()).map(([error, count]) => ({
      error,
      count,
      percentage: (count / totalRequests) * 100
    }));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      errorRate,
      startTime,
      endTime,
      duration,
      errors
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sortedArray.length) {
      return sortedArray[sortedArray.length - 1];
    }
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a detailed report
   */
  generateReport(result: LoadTestResult, testName: string): string {
    const report = `
📊 LOAD TEST REPORT: ${testName}
=====================================

📈 SUMMARY
----------
Total Requests: ${result.totalRequests}
Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)
Failed: ${result.failedRequests} (${(result.errorRate * 100).toFixed(2)}%)
Duration: ${(result.duration / 1000).toFixed(2)}s
Requests/Second: ${result.requestsPerSecond.toFixed(2)}

⏱️  RESPONSE TIMES
------------------
Average: ${result.averageResponseTime.toFixed(2)}ms
Minimum: ${result.minResponseTime.toFixed(2)}ms
Maximum: ${result.maxResponseTime.toFixed(2)}ms
95th Percentile: ${result.p95ResponseTime.toFixed(2)}ms
99th Percentile: ${result.p99ResponseTime.toFixed(2)}ms

❌ ERRORS
---------
${result.errors.length > 0 ? result.errors.map(e => `${e.error}: ${e.count} (${e.percentage.toFixed(2)}%)`).join('\n') : 'No errors'}

🎯 PERFORMANCE TARGETS
----------------------
✅ Response Time < 2000ms: ${result.averageResponseTime < 2000 ? 'PASS' : 'FAIL'}
✅ Error Rate < 1%: ${result.errorRate < 0.01 ? 'PASS' : 'FAIL'}
✅ RPS > 10: ${result.requestsPerSecond > 10 ? 'PASS' : 'FAIL'}
`;

    return report;
  }
}

/**
 * Performance benchmarking utility
 */
export class PerformanceBenchmark {
  private results: Map<string, number[]> = new Map();

  /**
   * Measure execution time of a function
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(duration);

    return result;
  }

  /**
   * Get benchmark results
   */
  getResults(): Map<string, { average: number; min: number; max: number; count: number }> {
    const benchmarkResults = new Map();
    
    for (const [name, times] of this.results.entries()) {
      const sorted = times.sort((a, b) => a - b);
      benchmarkResults.set(name, {
        average: times.reduce((sum, time) => sum + time, 0) / times.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        count: times.length
      });
    }
    
    return benchmarkResults;
  }

  /**
   * Generate benchmark report
   */
  generateReport(): string {
    const results = this.getResults();
    let report = '\n🏁 PERFORMANCE BENCHMARK REPORT\n================================\n\n';
    
    for (const [name, stats] of results.entries()) {
      report += `📊 ${name}\n`;
      report += `   Average: ${stats.average.toFixed(2)}ms\n`;
      report += `   Min: ${stats.min.toFixed(2)}ms\n`;
      report += `   Max: ${stats.max.toFixed(2)}ms\n`;
      report += `   Samples: ${stats.count}\n\n`;
    }
    
    return report;
  }
}

/**
 * Database performance testing utility
 */
export class DatabasePerformanceTest {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  /**
   * Test query performance
   */
  async testQueryPerformance(query: string, params: any[] = [], iterations: number = 100): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await this.pool.query(query, params);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const sorted = times.sort((a, b) => a - b);
    return {
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: sorted[0],
      maxTime: sorted[sorted.length - 1],
      totalTime: times.reduce((sum, time) => sum + time, 0)
    };
  }

  /**
   * Test concurrent query performance
   */
  async testConcurrentQueryPerformance(
    query: string, 
    params: any[] = [], 
    concurrentQueries: number = 10,
    iterations: number = 10
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
    queriesPerSecond: number;
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Execute concurrent queries
      const promises = Array(concurrentQueries).fill(null).map(() => 
        this.pool.query(query, params)
      );
      
      await Promise.all(promises);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const sorted = times.sort((a, b) => a - b);
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const queriesPerSecond = (concurrentQueries * iterations) / (totalTime / 1000);

    return {
      averageTime,
      minTime: sorted[0],
      maxTime: sorted[sorted.length - 1],
      totalTime,
      queriesPerSecond
    };
  }
}
