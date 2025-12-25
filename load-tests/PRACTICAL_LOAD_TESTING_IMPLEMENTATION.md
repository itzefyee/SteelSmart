# Practical Load Testing Implementation Guide

This guide provides ready-to-implement k6 load tests for SteelSmart's authentication, admin product management, and admin report features, following the same patterns as the existing product API tests.

## Quick Start

```bash
# 1. Install k6
npm install -g k6

# 2. Start your development server
npm run dev

# 3. Run the tests
k6 run load-tests/auth-login-smoke.js
k6 run load-tests/admin-products-smoke.js
k6 run load-tests/admin-reports-smoke.js
```

---

## 1. Authentication Load Testing

### File: `load-tests/auth-login-smoke.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success_rate');
const loginDuration = new Trend('login_duration');
const sessionValidationDuration = new Trend('session_validation_duration');
const logoutDuration = new Trend('logout_duration');
const errorCount = new Counter('error_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test user credentials (create these in your test database)
const TEST_USERS = [
  { email: 'admin@test.com', password: 'TestPass123!' },
  { email: 'user1@test.com', password: 'TestPass123!' },
  { email: 'user2@test.com', password: 'TestPass123!' },
];

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 concurrent logins
    { duration: '2m', target: 10 },  // Steady state
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'], // <5% failures
    login_success_rate: ['rate>0.95'], // >95% successful logins
    login_duration: ['p(95)<2000'],
    session_validation_duration: ['p(95)<500'],
    logout_duration: ['p(95)<1000'],
    error_count: ['count<10'],
  },
};

export default function () {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  // Scenario 1: Login (100% of users)
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  });
  
  loginDuration.add(loginRes.timings.duration);
  
  let token = null;
  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login returns token': (r) => {
      try {
        const body = r.json();
        if (body.success && body.data && body.data.session) {
          token = body.data.session.access_token;
          return !!token;
        }
        return false;
      } catch {
        return false;
      }
    },
    'login response time OK': (r) => r.timings.duration < 3000,
  });
  
  loginSuccessRate.add(loginSuccess ? 1 : 0);
  
  if (!loginSuccess) {
    errorCount.add(1);
    sleep(1);
    return;
  }
  
  // Scenario 2: Session validation (80% of successful logins)
  if (token && Math.random() < 0.8) {
    const sessionRes = http.get(`${BASE_URL}/api/auth/user`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'session_validation' },
    });
    
    sessionValidationDuration.add(sessionRes.timings.duration);
    
    const sessionSuccess = check(sessionRes, {
      'session status 200': (r) => r.status === 200,
      'session returns user': (r) => {
        try {
          const body = r.json();
          return body.user && body.user.email;
        } catch {
          return false;
        }
      },
      'session response time OK': (r) => r.timings.duration < 1000,
    });
    
    if (!sessionSuccess) {
      errorCount.add(1);
    }
    
    sleep(1 + Math.random() * 2); // User activity simulation
  }
  
  // Scenario 3: Logout (60% of users)
  if (token && Math.random() < 0.6) {
    const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'logout' },
    });
    
    logoutDuration.add(logoutRes.timings.duration);
    
    const logoutSuccess = check(logoutRes, {
      'logout status 200': (r) => r.status === 200,
      'logout response time OK': (r) => r.timings.duration < 2000,
    });
    
    if (!logoutSuccess) {
      errorCount.add(1);
    }
  }
  
  // Think time between login attempts
  sleep(Math.random() * 2 + 1);
}

export function setup() {
  console.log('Starting authentication load test');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Test users: ${TEST_USERS.length}`);
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log(`Auth test completed. Started: ${data.startTime}`);
}
```

### File: `load-tests/auth-register-smoke.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const registerSuccessRate = new Rate('register_success_rate');
const registerDuration = new Trend('register_duration');
const errorCount = new Counter('error_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 5 },   // Slower ramp for registration
    { duration: '2m', target: 5 },   // Steady state
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.1'], // Higher tolerance for registration
    register_success_rate: ['rate>0.8'], // Some may fail due to duplicates
    register_duration: ['p(95)<3000'],
    error_count: ['count<20'],
  },
};

export default function () {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 10000);
  
  // Generate unique test user
  const newUser = {
    email: `testuser${timestamp}${randomId}@loadtest.com`,
    password: 'TestPass123!',
    company: `Test Company ${randomId}`,
    phone: `+1-555-${String(randomId).padStart(4, '0')}`,
  };
  
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(newUser), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'register' },
  });
  
  registerDuration.add(registerRes.timings.duration);
  
  const registerSuccess = check(registerRes, {
    'register status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'register returns user data': (r) => {
      try {
        const body = r.json();
        return body.success || body.user;
      } catch {
        return false;
      }
    },
    'register response time OK': (r) => r.timings.duration < 5000,
  });
  
  registerSuccessRate.add(registerSuccess ? 1 : 0);
  
  if (!registerSuccess) {
    errorCount.add(1);
  }
  
  sleep(Math.random() * 3 + 2); // Longer think time for registration
}
```

---

## 2. Admin Product Management Load Testing

### File: `load-tests/admin-products-smoke.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const productListDuration = new Trend('product_list_duration');
const productCreateDuration = new Trend('product_create_duration');
const productUpdateDuration = new Trend('product_update_duration');
const productDeleteDuration = new Trend('product_delete_duration');
const adminOperationSuccessRate = new Rate('admin_operation_success_rate');
const errorCount = new Counter('error_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Admin credentials (create this user in your test database)
const ADMIN_USER = {
  email: 'admin@test.com',
  password: 'AdminPass123!',
};

let adminToken = null;

export const options = {
  stages: [
    { duration: '1m', target: 8 },   // Ramp up to 8 admin users
    { duration: '5m', target: 8 },   // Steady admin operations
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000', 'p(99)<8000'],
    http_req_failed: ['rate<0.05'],
    admin_operation_success_rate: ['rate>0.95'],
    product_list_duration: ['p(95)<1000'],
    product_create_duration: ['p(95)<3000'],
    product_update_duration: ['p(95)<2000'],
    product_delete_duration: ['p(95)<1000'],
    error_count: ['count<20'],
  },
};

export function setup() {
  // Login as admin to get token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(ADMIN_USER), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginRes.status === 200) {
    try {
      const body = loginRes.json();
      const token = body.data?.session?.access_token || body.token;
      if (token) {
        console.log('Admin authentication successful');
        return { token };
      }
    } catch (e) {
      console.error('Failed to parse login response:', e);
    }
  }
  
  throw new Error('Failed to authenticate admin user');
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Weighted operation selection (realistic admin workflow)
  const operation = Math.random();
  
  if (operation < 0.5) {
    // 50% - List products (most common admin operation)
    const page = Math.floor(Math.random() * 3) + 1; // Pages 1-3
    const listRes = http.get(`${BASE_URL}/api/admin/products?page=${page}&limit=10`, { 
      headers,
      tags: { name: 'admin_product_list' },
    });
    
    productListDuration.add(listRes.timings.duration);
    
    const listSuccess = check(listRes, {
      'admin product list 200': (r) => r.status === 200,
      'admin list has products': (r) => {
        try {
          const body = r.json();
          return body.products && Array.isArray(body.products);
        } catch {
          return false;
        }
      },
      'admin list response time OK': (r) => r.timings.duration < 2000,
    });
    
    adminOperationSuccessRate.add(listSuccess ? 1 : 0);
    if (!listSuccess) errorCount.add(1);
    
  } else if (operation < 0.7) {
    // 20% - Create product
    const timestamp = Date.now();
    const newProduct = {
      name: `Load Test Product ${timestamp}`,
      category: ['structural', 'robotic', 'fasteners', 'custom'][Math.floor(Math.random() * 4)],
      material: 'Steel',
      price: Math.floor(Math.random() * 1000) + 100,
      specifications: {
        length: `${Math.floor(Math.random() * 500) + 50}mm`,
        width: `${Math.floor(Math.random() * 200) + 25}mm`,
        weight: `${Math.floor(Math.random() * 10) + 1}kg`,
      },
      description: `Load test product created at ${new Date().toISOString()}`,
      technical_details: 'Standard specifications for load testing',
      lead_time: '2-3 weeks',
      in_stock: Math.random() > 0.3, // 70% in stock
    };
    
    const createRes = http.post(`${BASE_URL}/api/admin/products`, JSON.stringify(newProduct), { 
      headers,
      tags: { name: 'admin_product_create' },
    });
    
    productCreateDuration.add(createRes.timings.duration);
    
    const createSuccess = check(createRes, {
      'admin product create 201': (r) => r.status === 201,
      'admin create returns product': (r) => {
        try {
          const body = r.json();
          return body.product && body.product.id;
        } catch {
          return false;
        }
      },
      'admin create response time OK': (r) => r.timings.duration < 5000,
    });
    
    adminOperationSuccessRate.add(createSuccess ? 1 : 0);
    if (!createSuccess) errorCount.add(1);
    
  } else if (operation < 0.9) {
    // 20% - Update product
    const productId = `test-product-${Math.floor(Math.random() * 100) + 1}`;
    const updateData = {
      price: Math.floor(Math.random() * 1000) + 100,
      description: `Updated during load test at ${new Date().toISOString()}`,
      in_stock: Math.random() > 0.5,
    };
    
    const updateRes = http.put(`${BASE_URL}/api/admin/products/${productId}`, JSON.stringify(updateData), { 
      headers,
      tags: { name: 'admin_product_update' },
    });
    
    productUpdateDuration.add(updateRes.timings.duration);
    
    const updateSuccess = check(updateRes, {
      'admin product update response': (r) => r.status === 200 || r.status === 404, // 404 is OK for non-existent products
      'admin update response time OK': (r) => r.timings.duration < 3000,
    });
    
    adminOperationSuccessRate.add(updateSuccess ? 1 : 0);
    if (!updateSuccess) errorCount.add(1);
    
  } else {
    // 10% - Delete product
    const productId = `test-product-${Math.floor(Math.random() * 100) + 1}`;
    
    const deleteRes = http.del(`${BASE_URL}/api/admin/products/${productId}`, null, { 
      headers,
      tags: { name: 'admin_product_delete' },
    });
    
    productDeleteDuration.add(deleteRes.timings.duration);
    
    const deleteSuccess = check(deleteRes, {
      'admin product delete response': (r) => r.status === 200 || r.status === 404, // 404 is OK
      'admin delete response time OK': (r) => r.timings.duration < 2000,
    });
    
    adminOperationSuccessRate.add(deleteSuccess ? 1 : 0);
    if (!deleteSuccess) errorCount.add(1);
  }
  
  // Admin think time (admins work more deliberately)
  sleep(Math.random() * 4 + 2); // 2-6 seconds
}

export function teardown(data) {
  console.log('Admin product management test completed');
}
```

---

## 3. Admin Report Generation Load Testing

### File: `load-tests/admin-reports-smoke.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const reportCreateDuration = new Trend('report_create_duration');
const reportGenerationDuration = new Trend('report_generation_duration');
const reportDownloadDuration = new Trend('report_download_duration');
const reportSuccessRate = new Rate('report_success_rate');
const errorCount = new Counter('error_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const ADMIN_USER = {
  email: 'admin@test.com',
  password: 'AdminPass123!',
};

export const options = {
  stages: [
    { duration: '1m', target: 3 },   // Slow ramp for report generation
    { duration: '8m', target: 3 },   // Steady state (reports take time)
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<60000'], // Reports can take up to 1 minute
    http_req_failed: ['rate<0.1'],      // 10% tolerance for report failures
    report_success_rate: ['rate>0.8'],  // 80% successful report generation
    report_create_duration: ['p(95)<5000'],
    report_generation_duration: ['p(95)<45000'], // 45 seconds max
    report_download_duration: ['p(95)<10000'],
    error_count: ['count<10'],
  },
};

export function setup() {
  // Login as admin
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(ADMIN_USER), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginRes.status === 200) {
    try {
      const body = loginRes.json();
      const token = body.data?.session?.access_token || body.token;
      if (token) {
        console.log('Admin authentication successful for reports');
        return { token };
      }
    } catch (e) {
      console.error('Failed to parse login response:', e);
    }
  }
  
  throw new Error('Failed to authenticate admin user for reports');
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
      title: `Load Test ${reportType} Report - ${currentDate.toISOString()}`,
      description: `Generated during load test on ${currentDate.toLocaleDateString()}`,
      report_type: reportType,
      parameters: {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      },
    };
    
    // 1. Create report request
    const createRes = http.post(`${BASE_URL}/api/admin/reports`, JSON.stringify(reportRequest), { 
      headers,
      tags: { name: 'admin_report_create' },
    });
    
    reportCreateDuration.add(createRes.timings.duration);
    
    const createSuccess = check(createRes, {
      'report create 200': (r) => r.status === 200,
      'report create returns id': (r) => {
        try {
          const body = r.json();
          return body.data && body.data.reportId;
        } catch {
          return false;
        }
      },
      'report create response time OK': (r) => r.timings.duration < 10000,
    });
    
    if (!createSuccess) {
      errorCount.add(1);
      reportSuccessRate.add(0);
      sleep(2);
      return;
    }
    
    // Extract report ID
    let reportId;
    try {
      const body = createRes.json();
      reportId = body.data.reportId;
    } catch (e) {
      console.error('Failed to parse report creation response:', e);
      errorCount.add(1);
      reportSuccessRate.add(0);
      return;
    }
    
    // 2. Poll for report completion
    let reportCompleted = false;
    let pollAttempts = 0;
    const maxPollAttempts = 24; // 2 minutes max wait (5s intervals)
    const startTime = Date.now();
    
    while (!reportCompleted && pollAttempts < maxPollAttempts) {
      sleep(5); // Wait 5 seconds between polls
      pollAttempts++;
      
      const statusRes = http.get(`${BASE_URL}/api/admin/reports/${reportId}`, { 
        headers,
        tags: { name: 'admin_report_status' },
      });
      
      if (statusRes.status === 200) {
        try {
          const body = statusRes.json();
          const report = body.data;
          
          if (report.status === 'COMPLETED') {
            reportCompleted = true;
            const generationTime = Date.now() - startTime;
            reportGenerationDuration.add(generationTime);
            
            // 3. Download report if available
            if (report.file_url) {
              const downloadRes = http.get(report.file_url, {
                tags: { name: 'admin_report_download' },
              });
              
              reportDownloadDuration.add(downloadRes.timings.duration);
              
              const downloadSuccess = check(downloadRes, {
                'report download 200': (r) => r.status === 200,
                'report download has content': (r) => r.body && r.body.length > 1000, // Reasonable file size
                'report download response time OK': (r) => r.timings.duration < 15000,
              });
              
              if (!downloadSuccess) {
                errorCount.add(1);
              }
            }
            
          } else if (report.status === 'FAILED') {
            console.error(`Report ${reportId} failed to generate: ${report.error_message}`);
            errorCount.add(1);
            break;
          }
          // Continue polling if status is PENDING or PROCESSING
          
        } catch (e) {
          console.error('Failed to parse report status response:', e);
          errorCount.add(1);
          break;
        }
      } else {
        console.error(`Failed to get report status: ${statusRes.status}`);
        errorCount.add(1);
        break;
      }
    }
    
    reportSuccessRate.add(reportCompleted ? 1 : 0);
    
    if (!reportCompleted) {
      console.warn(`Report ${reportId} did not complete within ${maxPollAttempts * 5} seconds`);
      errorCount.add(1);
    }
    
  } else {
    // 20% - List and manage existing reports
    const listRes = http.get(`${BASE_URL}/api/admin/reports?page=1&limit=10`, { 
      headers,
      tags: { name: 'admin_report_list' },
    });
    
    const listSuccess = check(listRes, {
      'report list 200': (r) => r.status === 200,
      'report list has data': (r) => {
        try {
          const body = r.json();
          return body.data && body.data.reports;
        } catch {
          return false;
        }
      },
      'report list response time OK': (r) => r.timings.duration < 2000,
    });
    
    if (!listSuccess) {
      errorCount.add(1);
    }
  }
  
  // Longer think time for report operations
  sleep(Math.random() * 8 + 3); // 3-11 seconds
}

export function teardown(data) {
  console.log('Admin report generation test completed');
}
```

---

## 4. Running the Tests

### Individual Tests
```bash
# Authentication tests
k6 run load-tests/auth-login-smoke.js
k6 run load-tests/auth-register-smoke.js

# Admin product management
k6 run load-tests/admin-products-smoke.js

# Admin report generation
k6 run load-tests/admin-reports-smoke.js
```

### Custom Configuration
```bash
# Custom environment
BASE_URL=https://staging.steelsmart.com k6 run auth-login-smoke.js

# Save results
k6 run --out json=auth-results.json auth-login-smoke.js

# Quick test (30 seconds)
k6 run --stage 30s:5 admin-products-smoke.js
```

### Stress Testing
```bash
# Higher load versions
k6 run --stage 2m:20 --stage 5m:20 --stage 2m:0 auth-login-smoke.js
k6 run --stage 3m:15 --stage 8m:15 --stage 2m:0 admin-products-smoke.js
k6 run --stage 2m:8 --stage 10m:8 --stage 2m:0 admin-reports-smoke.js
```

---

## 5. Test Data Setup

### Required Test Users
Create these users in your test database:

```sql
-- Admin user for admin tests
INSERT INTO auth.users (email, encrypted_password) VALUES 
('admin@test.com', 'hashed_password_here');

INSERT INTO profiles (id, "Role") VALUES 
('admin_user_id', 'Admin');

-- Regular test users for auth tests
INSERT INTO auth.users (email, encrypted_password) VALUES 
('user1@test.com', 'hashed_password_here'),
('user2@test.com', 'hashed_password_here');
```

### Test Products
Create some test products for admin operations:

```sql
INSERT INTO products (id, name, category, price, material) VALUES 
('test-product-1', 'Test Steel Beam', 'structural', 299.99, 'Steel'),
('test-product-2', 'Test Servo Motor', 'robotic', 149.99, 'Aluminum'),
('test-product-3', 'Test Bolt Set', 'fasteners', 29.99, 'Steel');
```

---

## 6. Performance Expectations

### Authentication
- **Login**: <2s response time, >95% success rate
- **Session validation**: <500ms response time
- **Registration**: <3s response time, >80% success rate

### Admin Products
- **List products**: <1s response time
- **Create product**: <3s response time
- **Update/Delete**: <2s response time
- **Overall success rate**: >95%

### Admin Reports
- **Report creation**: <5s response time
- **Report generation**: <45s total time
- **Report download**: <10s response time
- **Success rate**: >80% (reports can fail due to data issues)

---

## 7. Monitoring & Debugging

### Key Metrics to Watch
```bash
# Run with detailed output
k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" auth-login-smoke.js

# Monitor specific thresholds
k6 run --threshold http_req_duration=p(95)<2000 admin-products-smoke.js
```

### Common Issues
- **High login times**: Check database connection pool, password hashing performance
- **Admin operation failures**: Verify admin permissions, check database constraints
- **Report generation timeouts**: Monitor PDF generation, database query performance
- **Memory issues**: Watch for memory leaks during report generation

### Debug Mode
```bash
# Verbose HTTP logging
k6 run --http-debug auth-login-smoke.js

# Custom log level
k6 run --log-level debug admin-reports-smoke.js
```

This practical guide provides ready-to-use k6 scripts that follow the same patterns as your existing product API tests, making them easy to integrate into your current testing workflow.