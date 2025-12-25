import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for optimized authentication testing
const loginSuccessRate = new Rate('login_success_rate');
const registerSuccessRate = new Rate('register_success_rate');
const sessionValidationRate = new Rate('session_validation_rate');
const loginDuration = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const sessionValidationDuration = new Trend('session_validation_duration');
const logoutDuration = new Trend('logout_duration');
const errorCount = new Counter('error_count');
const authThroughput = new Rate('auth_throughput');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Pre-created test users (run scripts/create-auth-test-users.ts first)
const TEST_USERS = [
  { email: 'testuser1@loadtest.com', password: 'TestPass123!' },
  { email: 'testuser2@loadtest.com', password: 'TestPass123!' },
  { email: 'testuser3@loadtest.com', password: 'TestPass123!' },
  { email: 'admin@test.com', password: 'AdminPass123!' },
];

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Warm up
    { duration: '2m', target: 15 },   // Ramp up to realistic load
    { duration: '1m', target: 20 },   // Peak load
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    // Optimized thresholds based on expected performance
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // More aggressive
    http_req_failed: ['rate<0.01'], // <1% failures
    
    // Authentication-specific thresholds
    login_success_rate: ['rate>0.99'], // >99% successful logins
    register_success_rate: ['rate>0.95'], // >95% successful registrations
    session_validation_rate: ['rate>0.99'], // >99% session validations
    
    // Optimized response time thresholds
    login_duration: ['p(95)<800', 'p(99)<1500'],
    register_duration: ['p(95)<1200', 'p(99)<2000'],
    session_validation_duration: ['p(95)<300', 'p(99)<600'],
    logout_duration: ['p(95)<500', 'p(99)<1000'],
    
    // Throughput target
    auth_throughput: ['rate>10'], // >10 auth operations per second
    
    // Error tracking
    error_count: ['count<3'],
  },
};

export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.8) {
    // 80% - Login flow (most common operation)
    performOptimizedLoginFlow();
  } else {
    // 20% - Registration flow
    performOptimizedRegistrationFlow();
  }
  
  // Reduced think time for higher throughput
  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
}

function performOptimizedLoginFlow() {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  // 1. Optimized login with minimal payload
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    tags: { name: 'auth_login_optimized' },
  });
  
  loginDuration.add(loginRes.timings.duration);
  authThroughput.add(1);
  
  let token = null;
  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has success field': (r) => {
      try {
        const body = r.json();
        return body.success === true;
      } catch {
        return false;
      }
    },
    'login returns session data': (r) => {
      try {
        const body = r.json();
        if (body.data && body.data.session) {
          token = body.data.session.access_token;
          return !!token;
        }
        return false;
      } catch {
        return false;
      }
    },
    'login response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  loginSuccessRate.add(loginSuccess ? 1 : 0);
  
  if (!loginSuccess) {
    errorCount.add(1);
    return;
  }
  
  // 2. Quick session validation (50% of logins for efficiency)
  if (token && Math.random() < 0.5) {
    const sessionRes = http.get(`${BASE_URL}/api/auth/user`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      tags: { name: 'auth_session_validation_optimized' },
    });
    
    sessionValidationDuration.add(sessionRes.timings.duration);
    authThroughput.add(1);
    
    const sessionSuccess = check(sessionRes, {
      'session status 200': (r) => r.status === 200,
      'session has user data': (r) => {
        try {
          const body = r.json();
          return body.user && body.user.email;
        } catch {
          return false;
        }
      },
      'session response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    sessionValidationRate.add(sessionSuccess ? 1 : 0);
    
    if (!sessionSuccess) {
      errorCount.add(1);
    }
    
    // Brief activity simulation
    sleep(0.2);
  }
  
  // 3. Logout (30% of users for efficiency)
  if (token && Math.random() < 0.3) {
    const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      tags: { name: 'auth_logout_optimized' },
    });
    
    logoutDuration.add(logoutRes.timings.duration);
    authThroughput.add(1);
    
    const logoutSuccess = check(logoutRes, {
      'logout status 200': (r) => r.status === 200,
      'logout response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    if (!logoutSuccess) {
      errorCount.add(1);
    }
  }
}

function performOptimizedRegistrationFlow() {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 100000);
  
  // Generate unique test user with minimal data
  const newUser = {
    email: `opttest${timestamp}${randomId}@loadtest.com`,
    password: 'TestPass123!',
    company: `OptTest${randomId}`,
  };
  
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(newUser), {
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    tags: { name: 'auth_register_optimized' },
  });
  
  registerDuration.add(registerRes.timings.duration);
  authThroughput.add(1);
  
  const registerSuccess = check(registerRes, {
    'register status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'register has success field': (r) => {
      try {
        const body = r.json();
        return body.success === true;
      } catch {
        return false;
      }
    },
    'register response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  registerSuccessRate.add(registerSuccess ? 1 : 0);
  
  if (!registerSuccess) {
    errorCount.add(1);
  }
  
  // Minimal think time after registration
  sleep(0.5);
}

export function setup() {
  console.log('🚀 Starting OPTIMIZED authentication load test');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Test users: ${TEST_USERS.length}`);
  console.log('Duration: 4 minutes (peak: 20 concurrent users)');
  console.log('Focus: High throughput auth operations');
  
  // Verify test users exist by attempting one login
  const testUser = TEST_USERS[0];
  const loginPayload = JSON.stringify({
    email: testUser.email,
    password: testUser.password,
  });
  
  const testRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (testRes.status !== 200) {
    console.error('❌ Test user validation failed!');
    console.error('   Run: npx tsx scripts/create-auth-test-users.ts');
    throw new Error('Test users not found - run user creation script first');
  }
  
  console.log('✅ Test users validated');
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log(`Optimized auth test completed. Started: ${data.startTime}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log('Check metrics for authentication performance improvements');
}