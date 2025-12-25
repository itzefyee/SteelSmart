# Admin Authentication & Features Load Testing Guide

This guide provides comprehensive load testing strategies for SteelSmart's authentication system and admin features including login/register, admin product management, and admin report generation.

## Overview

The admin load tests focus on three critical areas:
1. **Authentication Flow** - Login, registration, and session management
2. **Admin Product Management** - CRUD operations on products
3. **Admin Report Generation** - Report creation and download performance

## Prerequisites

- k6 installed ([Installation Guide](https://k6.io/docs/get-started/installation/))
- SteelSmart development server running (`npm run dev`)
- Redis cache running (`redis-cli ping` should return PONG)
- Supabase database accessible
- Admin user credentials for testing

## Test Files Structure

```
load-tests/
├── auth/
│   ├── auth-smoke.js           # Basic auth functionality
│   ├── auth-stress.js          # High-load auth testing
│   └── auth-security.js        # Security-focused tests
├── admin-products/
│   ├── admin-products-smoke.js # Basic CRUD operations
│   ├── admin-products-stress.js# High-load product management
│   └── admin-products-bulk.js  # Bulk operations testing
├── admin-reports/
│   ├── admin-reports-smoke.js  # Basic report generation
│   ├── admin-reports-stress.js # Concurrent report generation
│   └── admin-reports-load.js   # Heavy report workload
└── scenarios/
    ├── full-admin-workflow.js  # End-to-end admin scenarios
    └── mixed-workload.js       # Combined auth + admin operations
```

---

## 1. Authentication Load Testing

### Test Scenarios

#### A. Login Flow Testing (`auth-smoke.js`)
```javascript
// Test Configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 concurrent logins
    { duration: '3m', target: 20 },   // Steady state
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],   // <5% login failures
    login_success_rate: ['rate>0.95'], // >95% successful logins
    session_validation_duration: ['p(95)<500'],
  },
};

// Scenarios to test:
// 1. Valid admin login (80% of attempts)
// 2. Invalid credentials (15% of attempts) 
// 3. Account lockout scenarios (5% of attempts)
// 4. Session validation after login
// 5. Logout and session cleanup
```

**Key Metrics:**
- Login success rate (>95%)
- Session creation time (<2s)
- Token validation time (<500ms)
- Logout cleanup time (<1s)

#### B. Registration Flow Testing
```javascript
// Test user registration with various scenarios:
// 1. Valid new user registration
// 2. Duplicate email handling
// 3. Invalid input validation
// 4. Email verification flow (if applicable)
// 5. Profile creation after registration
```

#### C. Session Management Testing
```javascript
// Test session handling under load:
// 1. Concurrent session validation
// 2. Session timeout handling
// 3. Token refresh mechanisms
// 4. Cross-tab session synchronization
// 5. Session cleanup on logout
```

### Sample Auth Test Implementation

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const loginSuccessRate = new Rate('login_success_rate');
const sessionValidationDuration = new Trend('session_validation_duration');
const logoutDuration = new Trend('logout_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test credentials (use test accounts, not production)
const TEST_USERS = [
  { email: 'admin1@test.com', password: 'TestPass123!' },
  { email: 'admin2@test.com', password: 'TestPass123!' },
  // Add more test accounts as needed
];

export default function () {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  // 1. Login attempt
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login returns token': (r) => {
      try {
        const body = r.json();
        return body.token || body.access_token;
      } catch {
        return false;
      }
    },
    'login response time OK': (r) => r.timings.duration < 2000,
  });
  
  loginSuccessRate.add(loginSuccess ? 1 : 0);
  
  if (loginSuccess) {
    // Extract token for subsequent requests
    let token;
    try {
      const body = loginRes.json();
      token = body.token || body.access_token;
    } catch (e) {
      console.error('Failed to parse login response:', e);
      return;
    }
    
    // 2. Validate session with authenticated request
    const sessionRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    sessionValidationDuration.add(sessionRes.timings.duration);
    
    check(sessionRes, {
      'session validation 200': (r) => r.status === 200,
      'session returns user data': (r) => {
        try {
          const body = r.json();
          return body.user && body.user.email;
        } catch {
          return false;
        }
      },
    });
    
    sleep(1); // Simulate user activity
    
    // 3. Logout
    const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    logoutDuration.add(logoutRes.timings.duration);
    
    check(logoutRes, {
      'logout status 200': (r) => r.status === 200,
      'logout response time OK': (r) => r.timings.duration < 1000,
    });
  }
  
  sleep(Math.random() * 2 + 1); // Think time between login attempts
}
```

---

## 2. Admin Product Management Load Testing

### Test Scenarios

#### A. Product CRUD Operations (`admin-products-smoke.js`)
```javascript
// Test Configuration
export const options = {
  stages: [
    { duration: '2m', target: 15 },   // Ramp up to 15 concurrent admin users
    { duration: '5m', target: 15 },   // Steady state operations
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.03'],   // <3% operation failures
    product_create_duration: ['p(95)<2000'],
    product_update_duration: ['p(95)<1500'],
    product_delete_duration: ['p(95)<1000'],
    product_list_duration: ['p(95)<1000'],
  },
};

// Operations to test:
// 1. List products with pagination (40% of operations)
// 2. View product details (30% of operations)
// 3. Create new product (15% of operations)
// 4. Update existing product (10% of operations)
// 5. Delete product (5% of operations)
```

#### B. Bulk Operations Testing
```javascript
// Test bulk operations performance:
// 1. Bulk product import (CSV/JSON)
// 2. Bulk product updates
// 3. Bulk product deletion
// 4. Batch operations with large datasets
// 5. Concurrent bulk operations
```

### Sample Admin Product Test Implementation

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const productCreateDuration = new Trend('product_create_duration');
const productUpdateDuration = new Trend('product_update_duration');
const productDeleteDuration = new Trend('product_delete_duration');
const productListDuration = new Trend('product_list_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Admin authentication token (obtain this from login)
let adminToken = __ENV.ADMIN_TOKEN;

export function setup() {
  // Login as admin to get token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@test.com',
    password: 'AdminPass123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginRes.status === 200) {
    const body = loginRes.json();
    return { token: body.token || body.access_token };
  }
  
  throw new Error('Failed to authenticate admin user');
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Weighted operation selection
  const operation = Math.random();
  
  if (operation < 0.4) {
    // 40% - List products
    const listRes = http.get(`${BASE_URL}/api/admin/products?page=1&limit=20`, { headers });
    productListDuration.add(listRes.timings.duration);
    
    check(listRes, {
      'product list 200': (r) => r.status === 200,
      'product list has data': (r) => {
        try {
          const body = r.json();
          return body.products && Array.isArray(body.products);
        } catch {
          return false;
        }
      },
    });
    
  } else if (operation < 0.7) {
    // 30% - View product details
    const productId = `test-product-${Math.floor(Math.random() * 100)}`;
    const detailRes = http.get(`${BASE_URL}/api/admin/products/${productId}`, { headers });
    
    check(detailRes, {
      'product detail response': (r) => r.status === 200 || r.status === 404,
    });
    
  } else if (operation < 0.85) {
    // 15% - Create product
    const newProduct = {
      name: `Test Product ${Date.now()}`,
      category: 'structural',
      material: 'Steel',
      price: Math.floor(Math.random() * 1000) + 100,
      specifications: {
        length: '100mm',
        width: '50mm',
        weight: '2kg',
      },
      description: 'Load test product',
    };
    
    const createRes = http.post(`${BASE_URL}/api/admin/products`, JSON.stringify(newProduct), { headers });
    productCreateDuration.add(createRes.timings.duration);
    
    check(createRes, {
      'product create 201': (r) => r.status === 201,
      'product create returns id': (r) => {
        try {
          const body = r.json();
          return body.product && body.product.id;
        } catch {
          return false;
        }
      },
    });
    
  } else if (operation < 0.95) {
    // 10% - Update product
    const productId = `test-product-${Math.floor(Math.random() * 100)}`;
    const updateData = {
      price: Math.floor(Math.random() * 1000) + 100,
      description: `Updated at ${new Date().toISOString()}`,
    };
    
    const updateRes = http.put(`${BASE_URL}/api/admin/products/${productId}`, JSON.stringify(updateData), { headers });
    productUpdateDuration.add(updateRes.timings.duration);
    
    check(updateRes, {
      'product update response': (r) => r.status === 200 || r.status === 404,
    });
    
  } else {
    // 5% - Delete product
    const productId = `test-product-${Math.floor(Math.random() * 100)}`;
    const deleteRes = http.del(`${BASE_URL}/api/admin/products/${productId}`, null, { headers });
    productDeleteDuration.add(deleteRes.timings.duration);
    
    check(deleteRes, {
      'product delete response': (r) => r.status === 200 || r.status === 404,
    });
  }
  
  sleep(Math.random() * 3 + 1); // Admin think time
}
```

---

## 3. Admin Report Generation Load Testing

### Test Scenarios

#### A. Report Generation Testing (`admin-reports-smoke.js`)
```javascript
// Test Configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Ramp up to 5 concurrent report generators
    { duration: '10m', target: 5 },   // Steady state (reports take time)
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<30000'], // Reports can take up to 30s
    http_req_failed: ['rate<0.05'],     // <5% report failures
    report_generation_duration: ['p(95)<25000'],
    report_download_duration: ['p(95)<5000'],
  },
};

// Report types to test:
// 1. Audit Log Reports (40% of requests)
// 2. RFQ Performance Reports (40% of requests)
// 3. Report listing and management (20% of requests)
```

#### B. Concurrent Report Generation
```javascript
// Test concurrent report generation:
// 1. Multiple users generating reports simultaneously
// 2. Different report types at the same time
// 3. Large date ranges and complex reports
// 4. Report queue management
// 5. Resource usage during generation
```

### Sample Admin Report Test Implementation

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const reportGenerationDuration = new Trend('report_generation_duration');
const reportDownloadDuration = new Trend('report_download_duration');
const reportSuccessRate = new Rate('report_success_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // Login as admin to get token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@test.com',
    password: 'AdminPass123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginRes.status === 200) {
    const body = loginRes.json();
    return { token: body.token || body.access_token };
  }
  
  throw new Error('Failed to authenticate admin user');
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const operation = Math.random();
  
  if (operation < 0.8) {
    // 80% - Generate reports
    const reportTypes = ['AUDIT_LOG', 'RFQ_REPORT'];
    const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
    
    const currentDate = new Date();
    const reportRequest = {
      title: `Load Test ${reportType} - ${currentDate.toISOString()}`,
      description: `Generated during load test at ${currentDate.toISOString()}`,
      report_type: reportType,
      parameters: {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      },
    };
    
    // 1. Create report
    const createRes = http.post(`${BASE_URL}/api/admin/reports`, JSON.stringify(reportRequest), { headers });
    
    const reportCreated = check(createRes, {
      'report create 200': (r) => r.status === 200,
      'report create returns id': (r) => {
        try {
          const body = r.json();
          return body.data && body.data.reportId;
        } catch {
          return false;
        }
      },
    });
    
    if (reportCreated) {
      let reportId;
      try {
        const body = createRes.json();
        reportId = body.data.reportId;
      } catch (e) {
        console.error('Failed to parse report creation response:', e);
        return;
      }
      
      // 2. Poll for report completion
      let reportCompleted = false;
      let pollAttempts = 0;
      const maxPollAttempts = 60; // 5 minutes max wait
      
      while (!reportCompleted && pollAttempts < maxPollAttempts) {
        sleep(5); // Wait 5 seconds between polls
        pollAttempts++;
        
        const statusRes = http.get(`${BASE_URL}/api/admin/reports/${reportId}`, { headers });
        
        if (statusRes.status === 200) {
          try {
            const body = statusRes.json();
            const status = body.data.status;
            
            if (status === 'COMPLETED') {
              reportCompleted = true;
              reportGenerationDuration.add((pollAttempts * 5) * 1000); // Convert to ms
              
              // 3. Download report if completed
              if (body.data.file_url) {
                const downloadRes = http.get(body.data.file_url);
                reportDownloadDuration.add(downloadRes.timings.duration);
                
                check(downloadRes, {
                  'report download 200': (r) => r.status === 200,
                  'report download has content': (r) => r.body && r.body.length > 0,
                });
              }
              
            } else if (status === 'FAILED') {
              console.error(`Report ${reportId} failed to generate`);
              break;
            }
          } catch (e) {
            console.error('Failed to parse report status response:', e);
            break;
          }
        }
      }
      
      reportSuccessRate.add(reportCompleted ? 1 : 0);
      
      if (!reportCompleted) {
        console.warn(`Report ${reportId} did not complete within timeout`);
      }
    }
    
  } else {
    // 20% - List and manage reports
    const listRes = http.get(`${BASE_URL}/api/admin/reports?page=1&limit=10`, { headers });
    
    check(listRes, {
      'report list 200': (r) => r.status === 200,
      'report list has data': (r) => {
        try {
          const body = r.json();
          return body.data && body.data.reports;
        } catch {
          return false;
        }
      },
    });
  }
  
  sleep(Math.random() * 5 + 2); // Longer think time for report operations
}
```

---

## 4. Combined Workflow Testing

### Full Admin Workflow Test (`full-admin-workflow.js`)

```javascript
// Comprehensive test simulating real admin usage:
// 1. Login as admin
// 2. Browse and manage products
// 3. Generate reports
// 4. Download and review reports
// 5. Perform bulk operations
// 6. Logout

export const options = {
  stages: [
    { duration: '2m', target: 8 },    // Ramp up to 8 admin users
    { duration: '15m', target: 8 },   // Extended workflow testing
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
    workflow_completion_rate: ['rate>0.9'], // >90% complete workflows
  },
};
```

---

## 5. Performance Targets & Thresholds

### Authentication Performance
| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Login Duration | < 1s | < 2s | > 3s |
| Session Validation | < 200ms | < 500ms | > 1s |
| Logout Duration | < 500ms | < 1s | > 2s |
| Login Success Rate | > 98% | > 95% | < 90% |

### Admin Product Management
| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Product List | < 500ms | < 1s | > 2s |
| Product Create | < 1s | < 2s | > 5s |
| Product Update | < 800ms | < 1.5s | > 3s |
| Product Delete | < 500ms | < 1s | > 2s |
| Operation Success Rate | > 97% | > 95% | < 90% |

### Admin Report Generation
| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Report Creation | < 2s | < 5s | > 10s |
| Report Generation | < 15s | < 30s | > 60s |
| Report Download | < 2s | < 5s | > 10s |
| Generation Success Rate | > 95% | > 90% | < 85% |

---

## 6. Running the Tests

### Basic Test Execution
```bash
# Authentication tests
k6 run load-tests/auth/auth-smoke.js
k6 run load-tests/auth/auth-stress.js

# Admin product tests
k6 run load-tests/admin-products/admin-products-smoke.js
k6 run load-tests/admin-products/admin-products-stress.js

# Admin report tests
k6 run load-tests/admin-reports/admin-reports-smoke.js
k6 run load-tests/admin-reports/admin-reports-stress.js

# Full workflow test
k6 run load-tests/scenarios/full-admin-workflow.js
```

### With Custom Configuration
```bash
# Custom base URL
BASE_URL=https://staging.steelsmart.com k6 run auth-smoke.js

# Custom admin credentials
ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=TestPass123! k6 run admin-products-smoke.js

# Output to file
k6 run --out json=results.json admin-reports-smoke.js
```

### CI/CD Integration
```bash
# Quick validation (suitable for CI)
k6 run --stage 30s:5 --stage 1m:5 --stage 30s:0 auth-smoke.js

# Performance regression testing
k6 run --threshold http_req_duration=p(95)<2000 admin-products-smoke.js
```

---

## 7. Monitoring & Troubleshooting

### Key Metrics to Monitor
- **Authentication**: Login success rate, session creation time, token validation
- **Product Management**: CRUD operation performance, database connection pool
- **Report Generation**: Generation time, concurrent report limits, file storage
- **System Resources**: CPU, memory, database connections, Redis cache

### Common Issues & Solutions

#### High Authentication Latency
- Check database connection pool size
- Verify password hashing performance
- Monitor session storage (Redis/database)
- Check network latency to auth provider

#### Product Management Bottlenecks
- Database query optimization
- Index performance on filtered columns
- File upload/storage performance
- Concurrent operation limits

#### Report Generation Issues
- PDF generation library performance
- Database query complexity for large datasets
- File storage and retrieval performance
- Memory usage during report generation

### Debugging Commands
```bash
# Verbose output
k6 run --http-debug auth-smoke.js

# Custom thresholds for debugging
k6 run --threshold http_req_duration=p(95)<10000 admin-reports-smoke.js

# Monitor specific metrics
k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" admin-products-smoke.js
```

---

## 8. Best Practices

### Before Testing
1. ✅ Set up dedicated test database/environment
2. ✅ Create test admin accounts (don't use production accounts)
3. ✅ Clear caches and reset test data
4. ✅ Monitor system resources baseline
5. ✅ Verify all services are running (Redis, database, etc.)

### During Testing
1. 📊 Monitor server logs in real-time
2. 📊 Watch database connection counts
3. 📊 Track memory usage during report generation
4. 📊 Monitor file storage usage
5. 📊 Check for error patterns and bottlenecks

### After Testing
1. 📈 Analyze performance trends
2. 📈 Review error logs and patterns
3. 📈 Compare against baseline metrics
4. 📈 Document findings and recommendations
5. 📈 Clean up test data and generated files

### Security Considerations
- Use test credentials only
- Don't expose real admin tokens in scripts
- Clean up test data after runs
- Monitor for authentication bypass attempts
- Validate rate limiting effectiveness

---

## 9. Integration with Existing Tests

These admin-focused tests complement the existing product API tests:

```bash
# Run complete test suite
k6 run load-tests/load-products-smoke.js      # Public API
k6 run load-tests/auth/auth-smoke.js          # Authentication
k6 run load-tests/admin-products/admin-products-smoke.js  # Admin features
k6 run load-tests/admin-reports/admin-reports-smoke.js    # Report generation
```

### Test Data Management
- Use consistent test data across all tests
- Implement setup/teardown for test isolation
- Consider using test fixtures for repeatable scenarios
- Monitor test data growth and cleanup

---

This comprehensive guide provides the foundation for thorough load testing of SteelSmart's admin authentication and management features. Adjust the test parameters and scenarios based on your specific performance requirements and infrastructure constraints.