import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for application endpoint stress testing
const appSuccessRate = new Rate('app_success_rate');
const productApiSuccessRate = new Rate('product_api_success_rate');
const categoryApiSuccessRate = new Rate('category_api_success_rate');
const recommendationApiSuccessRate = new Rate('recommendation_api_success_rate');
const appDuration = new Trend('app_duration');
const productApiDuration = new Trend('product_api_duration');
const categoryApiDuration = new Trend('category_api_duration');
const recommendationApiDuration = new Trend('recommendation_api_duration');
const apiErrorCount = new Counter('api_error_count');
const concurrentRequestCount = new Counter('concurrent_request_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up to 10 users
    { duration: '3m', target: 20 },   // Ramp to realistic peak (20 users)
    { duration: '2m', target: 25 },   // Stress peak (25 users)
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    // Stress test thresholds (more lenient)
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'], // <5% failures under stress
    
    // API success rates under stress
    app_success_rate: ['rate>0.95'], // >95% successful API calls
    product_api_success_rate: ['rate>0.95'], // >95% successful product calls
    category_api_success_rate: ['rate>0.95'], // >95% successful category calls
    recommendation_api_success_rate: ['rate>0.90'], // >90% successful recommendation calls
    
    // Response time thresholds under stress
    app_duration: ['p(95)<2500', 'p(99)<4000'],
    product_api_duration: ['p(95)<2000', 'p(99)<3500'],
    category_api_duration: ['p(95)<1500', 'p(99)<2500'],
    recommendation_api_duration: ['p(95)<3500', 'p(99)<5000'],
    
    // Error tracking
    api_error_count: ['count<25'], // Allow more errors under stress
  },
};

export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Product API stress testing
    performProductAPIStress();
  } else if (scenario < 0.7) {
    // 30% - Category API stress testing
    performCategoryAPIStress();
  } else {
    // 30% - Rapid API cycles (stress scenario)
    performRapidAPICycles();
  }
  
  // Shorter think time under stress
  sleep(Math.random() * 1.5 + 0.5); // 0.5-2 seconds
}

function performProductAPIStress() {
  // Test products with various filters under stress
  const filters = [
    '',
    '?category=Robotic%20Components',
    '?category=Structural%20Steel',
    '?category=Fasteners',
    '?category=Custom%20Parts',
    '?minPrice=10&maxPrice=100',
    '?minPrice=100&maxPrice=500',
    '?minPrice=500&maxPrice=2000',
    '?search=steel',
    '?search=motor',
    '?search=bolt',
    '?search=bracket',
  ];
  
  const filter = filters[Math.floor(Math.random() * filters.length)];
  
  const productRes = http.get(`${BASE_URL}/api/products${filter}`, {
    tags: { name: 'products_stress' },
  });
  
  productApiDuration.add(productRes.timings.duration);
  
  const productSuccess = check(productRes, {
    'products status 200': (r) => r.status === 200,
    'products returns data': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body) && body.length >= 0;
      } catch {
        return false;
      }
    },
    'products response time acceptable': (r) => r.timings.duration < 4000, // More lenient under stress
  });
  
  productApiSuccessRate.add(productSuccess ? 1 : 0);
  appSuccessRate.add(productSuccess ? 1 : 0);
  
  if (!productSuccess) {
    apiErrorCount.add(1);
    return;
  }
  
  concurrentRequestCount.add(1);
  
  // Multiple product detail requests (stress test)
  if (Math.random() < 0.6) {
    const requestCount = Math.floor(Math.random() * 3) + 1; // 1-3 requests
    
    for (let i = 0; i < requestCount; i++) {
      sleep(0.1); // Brief pause between requests
      
      const productId = Math.floor(Math.random() * 22) + 1;
      
      const singleProductRes = http.get(`${BASE_URL}/api/products/${productId}`, {
        tags: { name: 'single_product_stress' },
      });
      
      productApiDuration.add(singleProductRes.timings.duration);
      
      const singleProductSuccess = check(singleProductRes, {
        'single product status 200': (r) => r.status === 200,
        'single product returns data': (r) => {
          try {
            const body = r.json();
            return typeof body === 'object' && body.id;
          } catch {
            return false;
          }
        },
        'single product response time acceptable': (r) => r.timings.duration < 3000,
      });
      
      productApiSuccessRate.add(singleProductSuccess ? 1 : 0);
      appSuccessRate.add(singleProductSuccess ? 1 : 0);
      
      if (!singleProductSuccess) {
        apiErrorCount.add(1);
      }
    }
    
    // Simulate user activity under stress
    sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
  }
}

function performCategoryAPIStress() {
  // Test categories endpoint under stress
  const categoryRes = http.get(`${BASE_URL}/api/categories`, {
    tags: { name: 'categories_stress' },
  });
  
  categoryApiDuration.add(categoryRes.timings.duration);
  
  const categorySuccess = check(categoryRes, {
    'categories status 200': (r) => r.status === 200,
    'categories returns data': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body) && body.length > 0;
      } catch {
        return false;
      }
    },
    'categories response time acceptable': (r) => r.timings.duration < 2000,
  });
  
  categoryApiSuccessRate.add(categorySuccess ? 1 : 0);
  appSuccessRate.add(categorySuccess ? 1 : 0);
  
  if (!categorySuccess) {
    apiErrorCount.add(1);
  }
  
  // Follow up with filtered product requests based on categories
  if (categorySuccess && Math.random() < 0.7) {
    const categories = ['Robotic%20Components', 'Structural%20Steel', 'Fasteners', 'Custom%20Parts'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    sleep(0.2);
    
    const filteredRes = http.get(`${BASE_URL}/api/products?category=${category}`, {
      tags: { name: 'filtered_products_stress' },
    });
    
    productApiDuration.add(filteredRes.timings.duration);
    
    const filteredSuccess = check(filteredRes, {
      'filtered products status 200': (r) => r.status === 200,
      'filtered products response time acceptable': (r) => r.timings.duration < 3000,
    });
    
    productApiSuccessRate.add(filteredSuccess ? 1 : 0);
    appSuccessRate.add(filteredSuccess ? 1 : 0);
    
    if (!filteredSuccess) {
      apiErrorCount.add(1);
    }
  }
}

function performRapidAPICycles() {
  // Stress scenario: Rapid API request cycles
  for (let cycle = 0; cycle < 3; cycle++) { // 3 rapid cycles
    const endpoints = [
      '/api/products',
      '/api/categories',
      '/api/products?category=Fasteners',
      '/api/products?search=steel',
    ];
    
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    
    const res = http.get(`${BASE_URL}${endpoint}`, {
      tags: { name: 'rapid_cycle_stress' },
    });
    
    appDuration.add(res.timings.duration);
    
    const success = check(res, {
      'rapid cycle success': (r) => r.status === 200,
      'rapid cycle response time acceptable': (r) => r.timings.duration < 4000,
    });
    
    appSuccessRate.add(success ? 1 : 0);
    
    if (success) {
      concurrentRequestCount.add(1);
    } else {
      apiErrorCount.add(1);
    }
    
    sleep(0.1); // Brief pause between cycles
  }
}

export function setup() {
  console.log('Starting application endpoint STRESS test');
  console.log(`Target: ${BASE_URL}`);
  console.log('Testing: Products API, Categories API, Mixed endpoints under stress');
  console.log('Duration: 7 minutes (peak: 25 concurrent users)');
  console.log('Scenarios: Product API (40%), Category API (30%), Rapid cycles (30%)');
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log(`Application endpoint stress test completed. Started: ${data.startTime}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log('Check metrics for API performance under stress');
}