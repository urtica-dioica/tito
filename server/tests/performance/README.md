# Performance Testing Suite

This directory contains comprehensive performance tests for the TITO HR Management System, including load testing, stress testing, database performance testing, and benchmarking.

## 📊 Test Types

### 1. Load Testing (`authLoadTest.test.ts`, `payrollLoadTest.test.ts`)
- **Purpose**: Test system performance under normal to high load conditions
- **Coverage**: Authentication endpoints, payroll endpoints, concurrent user scenarios
- **Metrics**: Response time, throughput, error rates, concurrent user handling

### 2. Database Performance Testing (`databasePerformanceTest.test.ts`)
- **Purpose**: Test database query performance and optimization
- **Coverage**: User queries, employee queries, attendance queries, payroll queries
- **Metrics**: Query execution time, concurrent query handling, connection pool performance

### 3. Performance Benchmarking (`performanceBenchmark.test.ts`)
- **Purpose**: Establish performance baselines and detect regressions
- **Coverage**: API endpoints, database queries, system resource usage
- **Metrics**: Response time baselines, memory usage, CPU usage, performance consistency

## 🚀 Quick Start

### Prerequisites
1. **Server Running**: Ensure the TITO HR server is running on `http://localhost:3000`
2. **Database**: PostgreSQL database must be accessible and populated with test data
3. **Dependencies**: All npm dependencies must be installed

### Running Performance Tests

#### Run All Performance Tests
```bash
# From the server directory
npm run test:performance

# Or using the custom runner
node tests/performance/runPerformanceTests.js
```

#### Run Specific Test Types
```bash
# Load tests only
node tests/performance/runPerformanceTests.js --load-only

# Database performance tests only
node tests/performance/runPerformanceTests.js --database-only

# Benchmark tests only
node tests/performance/runPerformanceTests.js --benchmark-only
```

#### Run Individual Test Files
```bash
# Authentication load tests
npm test -- --testPathPattern="authLoadTest"

# Payroll load tests
npm test -- --testPathPattern="payrollLoadTest"

# Database performance tests
npm test -- --testPathPattern="databasePerformanceTest"

# Performance benchmarks
npm test -- --testPathPattern="performanceBenchmark"
```

## 📈 Performance Thresholds

### API Endpoint Thresholds
| Endpoint Category | Average Response Time | Max Response Time | Error Rate |
|------------------|---------------------|------------------|------------|
| Authentication | < 2000ms | < 5000ms | < 5% |
| Payroll | < 3000ms | < 8000ms | < 10% |
| Employee | < 2500ms | < 6000ms | < 8% |
| Department | < 1500ms | < 4000ms | < 5% |

### Database Query Thresholds
| Query Type | Average Time | Max Time | Concurrent QPS |
|------------|-------------|----------|----------------|
| User Authentication | < 50ms | < 200ms | > 50 |
| Employee Listing | < 100ms | < 300ms | > 30 |
| Attendance Stats | < 150ms | < 400ms | > 25 |
| Payroll Summary | < 200ms | < 600ms | > 20 |
| Department Stats | < 100ms | < 300ms | > 30 |

### Load Test Thresholds
| Metric | Threshold | Description |
|--------|-----------|-------------|
| Average Response Time | < 2000ms | Mean response time across all requests |
| 95th Percentile | < 4000ms | 95% of requests complete within this time |
| 99th Percentile | < 6000ms | 99% of requests complete within this time |
| Error Rate | < 5% | Percentage of failed requests |
| Requests/Second | > 10 | Minimum throughput requirement |

## 🔧 Configuration

### Environment Variables
```bash
# Test server URL
TEST_BASE_URL=http://localhost:3000

# Performance test mode
PERFORMANCE_TEST_MODE=true

# Test timeout (milliseconds)
TEST_TIMEOUT=300000

# Concurrent users for load tests
LOAD_TEST_USERS=10

# Requests per user
REQUESTS_PER_USER=5
```

### Test Configuration
```javascript
// Load test configuration
const config = {
  baseURL: 'http://localhost:3000',
  concurrentUsers: 10,
  requestsPerUser: 5,
  rampUpTime: 2000, // 2 seconds
  testDuration: 30000, // 30 seconds
  timeout: 10000 // 10 seconds
};
```

## 📊 Test Results and Reporting

### Real-time Output
Performance tests provide detailed real-time output including:
- Request/response metrics
- Error rates and types
- Performance thresholds status
- Memory and CPU usage

### Generated Reports
After test completion, a comprehensive report is generated at:
```
tests/performance/performance-report.md
```

### Sample Output
```
📊 LOAD TEST REPORT: Login Endpoint Load Test
=====================================

📈 SUMMARY
----------
Total Requests: 50
Successful: 48 (96.00%)
Failed: 2 (4.00%)
Duration: 15.23s
Requests/Second: 3.28

⏱️  RESPONSE TIMES
------------------
Average: 1,245.67ms
Minimum: 234.12ms
Maximum: 3,456.78ms
95th Percentile: 2,890.45ms
99th Percentile: 3,234.56ms

❌ ERRORS
---------
HTTP 401: 2 (4.00%)

🎯 PERFORMANCE TARGETS
----------------------
✅ Response Time < 2000ms: PASS
✅ Error Rate < 1%: FAIL
✅ RPS > 10: FAIL
```

## 🛠️ Customization

### Adding New Load Tests
1. Create a new test file in the `performance` directory
2. Import the `LoadTestRunner` and `LoadTestConfig` from `loadTestUtils.ts`
3. Define your test configuration and request function
4. Add performance assertions based on your requirements

```typescript
import { LoadTestRunner, LoadTestConfig } from './loadTestUtils';

describe('Custom Load Tests', () => {
  it('should test custom endpoint', async () => {
    const config: LoadTestConfig = {
      baseURL: 'http://localhost:3000',
      concurrentUsers: 5,
      requestsPerUser: 3,
      rampUpTime: 1000,
      testDuration: 20000,
      timeout: 10000
    };

    const runner = new LoadTestRunner(config);
    
    const requestFunction = async (axios: any) => {
      return axios.get('/api/v1/custom-endpoint');
    };

    const result = await runner.runLoadTest(requestFunction, 'Custom Endpoint Test');
    
    expect(result.averageResponseTime).toBeLessThan(2000);
    expect(result.errorRate).toBeLessThan(0.05);
  });
});
```

### Adding New Database Performance Tests
```typescript
import { DatabasePerformanceTest } from './loadTestUtils';
import { getPool } from '../../src/config/database';

describe('Custom Database Tests', () => {
  it('should test custom query performance', async () => {
    const pool = getPool();
    const dbTest = new DatabasePerformanceTest(pool);
    
    const query = 'SELECT * FROM custom_table WHERE condition = $1';
    const params = ['test-value'];
    
    const result = await dbTest.testQueryPerformance(query, params, 100);
    
    expect(result.averageTime).toBeLessThan(100);
    expect(result.maxTime).toBeLessThan(300);
  });
});
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Server Not Running
```
❌ Server is not running or not accessible
```
**Solution**: Start the TITO HR server before running performance tests
```bash
npm start
```

#### 2. Database Connection Issues
```
❌ Database connection failed
```
**Solution**: Ensure PostgreSQL is running and accessible
```bash
# Check database connection
psql -h localhost -U your_username -d tito_hr
```

#### 3. Authentication Failures
```
❌ Could not obtain auth token for load test
```
**Solution**: Ensure test users exist in the database
```bash
# Run database seeding
npm run seed:test
```

#### 4. High Memory Usage
```
❌ Memory usage exceeded threshold
```
**Solution**: Reduce concurrent users or requests per user in test configuration

#### 5. Timeout Issues
```
❌ Test timeout exceeded
```
**Solution**: Increase timeout values in test configuration or reduce test complexity

### Performance Issues

#### Slow Response Times
1. **Check Database**: Ensure proper indexing and query optimization
2. **Check Server Resources**: Monitor CPU and memory usage
3. **Check Network**: Verify network latency and bandwidth
4. **Check Dependencies**: Ensure external services are responsive

#### High Error Rates
1. **Check Server Logs**: Look for error patterns
2. **Check Database**: Verify database performance and connections
3. **Check Authentication**: Ensure test credentials are valid
4. **Check Rate Limiting**: Verify rate limiting settings

## 📚 Best Practices

### 1. Test Environment
- Use dedicated test environment separate from production
- Ensure consistent test data and environment setup
- Monitor system resources during tests

### 2. Test Data
- Use realistic test data that matches production patterns
- Ensure sufficient test data for meaningful results
- Clean up test data after tests complete

### 3. Test Execution
- Run tests during off-peak hours to avoid interference
- Use consistent test configurations for comparable results
- Document any environment-specific configurations

### 4. Result Analysis
- Compare results against established baselines
- Look for trends and patterns in performance data
- Investigate any significant deviations from expected performance

### 5. Continuous Monitoring
- Run performance tests regularly (e.g., after each release)
- Set up alerts for performance regressions
- Track performance metrics over time

## 🔗 Related Documentation

- [API Documentation](../../docs/api/)
- [Database Schema](../../docs/database/)
- [Deployment Guide](../../docs/deployment/)
- [Monitoring Guide](../../docs/monitoring/)

## 📞 Support

For issues with performance tests:
1. Check the troubleshooting section above
2. Review server and database logs
3. Verify test environment configuration
4. Contact the development team with detailed error information

---

**Last Updated**: January 27, 2025  
**Version**: 1.0.0  
**Status**: ✅ **PRODUCTION READY**

