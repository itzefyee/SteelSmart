import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for application endpoint testing
const appSuccessRate = new Rate('app_success_rate');
const productApiSuccessRate = new Rate('product_api_success_rate');
const categoryApiSuccessRate = new Rate('category_api_success_rate');
const recommendationApiSuccessRate = new Rate('recommendation_api_success_rate');
const appDuration = new Trend('app_duration');
const productApiDuration = new Trend('product_api_duration');
const categoryApiDuration = new Trend('category_api_duration');
const recommendationApiDuration = new Trend('recommendation_api_duration');
const apiErrorCount = new Counter('api_error_count');
const requestCount = new Counter('request_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Warm up to 5 users
    { duration: '1m', target: 10 },   // Ramp to 10 users
    { duration: '1m', target: 5 },    // Scale back
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    // Smoke test thresholds (strict)
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.02'], // <2% failures
    
    // API success rates
    app_success_rate: ['rate>0.98'], // >98% successful API calls
    product_api_success_rate: ['rate>0.98'], // >98% successful product calls
    category_api_success_rate: ['rate>0.98'], // >98% successful category calls
    recommendation_api_success_rate: ['rate>0.95'], // >95% successful recommendation calls
    
    // Response time thresholds
    app_duration: ['p(95)<1500', 'p(99)<2500'],
    product_api_duration: ['p(95)<1000', 'p(99)<1500'],
    category_api_duration: ['p(95)<800', 'p(99)<1200'],
    recommendation_api_duration: ['p(95)<2000', 'p(99)<3000'],
    
    // Error tracking
    api_error_count: ['count<5'], // Very few errors allowed
  },
};

export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Product API testing
    performProductAPITest();
  } else if (scenario < 0.7) {
    // 30% - Category API testing
    performCategoryAPITest();
  } else {
    // 30% - Recommendation API testing
    performRecommendationAPITest();
  }
  
  // Think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function performProductAPITest() {
  // Test products endpoint with various filters
  const filters = [
    '',
    '?category=Robotic%20Components',
    '?category=Structural%20Steel',
    '?category=Fasteners',
    '?category=Custom%20Parts',
    '?minPrice=10&maxPrice=100',
    '?minPrice=100&maxPrice=500',
    '?search=steel',
    '?search=motor',
    '?search=bolt',
  ];
  
  const filter = filters[Math.floor(Math.random() * filters.length)];
  
  const productRes = http.get(`${BASE_URL}/api/products${filter}`, {
    tags: { name: 'products_api' },
  });
  
  productApiDuration.add(productRes.timings.duration);
  requestCount.add(1);
  
  const productSuccess = check(productRes, {
    'products status 200': (r) => r.status === 200,
    'products returns array': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body) && body.length >= 0;
      } catch {
        return false;
      }
    },
    'products response time acceptable': (r) => r.timings.duration < 2000,
    'products has valid structure': (r) => {
      try {
        const body = r.json();
        if (!Array.isArray(body) || body.length === 0) return true;
        const item = body[0];
        return item.id && item.name && typeof item.price === 'number';
      } catch {
        return false;
      }
    },
  });
  
  productApiSuccessRate.add(productSuccess ? 1 : 0);
  appSuccessRate.add(productSuccess ? 1 : 0);
  
  if (!productSuccess) {
    apiErrorCount.add(1);
    return;
  }
  
  // Follow up with single product request
  if (Math.random() < 0.5) {
    sleep(0.2);
    
    const productId = Math.floor(Math.random() * 22) + 1; // Assuming 22 products
    
    const singleProductRes = http.get(`${BASE_URL}/api/products/${productId}`, {
      tags: { name: 'single_product_api' },
    });
    
    productApiDuration.add(singleProductRes.timings.duration);
    requestCount.add(1);
    
    const singleProductSuccess = check(singleProductRes, {
      'single product status 200': (r) => r.status === 200,
      'single product returns object': (r) => {
        try {
          const body = r.json();
          return typeof body === 'object' && body.id;
        } catch {
          return false;
        }
      },
      'single product response time acceptable': (r) => r.timings.duration < 1500,
    });
    
    productApiSuccessRate.add(singleProductSuccess ? 1 : 0);
    appSuccessRate.add(singleProductSuccess ? 1 : 0);
    
    if (!singleProductSuccess) {
      apiErrorCount.add(1);
    }
  }
}

function performCategoryAPITest() {
  // Test categories endpoint
  const categoryRes = http.get(`${BASE_URL}/api/categories`, {
    tags: { name: 'categories_api' },
  });
  
  categoryApiDuration.add(categoryRes.timings.duration);
  requestCount.add(1);
  
  const categorySuccess = check(categoryRes, {
    'categories status 200': (r) => r.status === 200,
    'categories returns array': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body) && body.length > 0;
      } catch {
        return false;
      }
    },
    'categories response time acceptable': (r) => r.timings.duration < 1000,
    'categories has valid structure': (r) => {
      try {
        const body = r.json();
        if (!Array.isArray(body) || body.length === 0) return false;
        const item = body[0];
        return item.name && typeof item.name === 'string';
      } catch {
        return false;
      }
    },
  });
  
  categoryApiSuccessRate.add(categorySuccess ? 1 : 0);
  appSuccessRate.add(categorySuccess ? 1 : 0);
  
  if (!categorySuccess) {
    apiErrorCount.add(1);
    return;
  }
  
  // Follow up with filtered product request based on category
  if (Math.random() < 0.6) {
    const categories = ['Robotic%20Components', 'Structural%20Steel', 'Fasteners', 'Custom%20Parts'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    sleep(0.3);
    
    const filteredRes = http.get(`${BASE_URL}/api/products?category=${category}`, {
      tags: { name: 'filtered_products_api' },
    });
    
    productApiDuration.add(filteredRes.timings.duration);
    requestCount.add(1);
    
    const filteredSuccess = check(filteredRes, {
      'filtered products status 200': (r) => r.status === 200,
      'filtered products response time acceptable': (r) => r.timings.duration < 1500,
    });
    
    productApiSuccessRate.add(filteredSuccess ? 1 : 0);
    appSuccessRate.add(filteredSuccess ? 1 : 0);
    
    if (!filteredSuccess) {
      apiErrorCount.add(1);
    }
  }
}

function performRecommendationAPITest() {
  // Test recommendation endpoint with sample data
  const sampleSpecs = [
    {
      dimensions: { length: 100, width: 50, height: 20 },
      material: 'Steel',
      tolerance: '±0.1mm',
      quantity: 10
    },
    {
      dimensions: { diameter: 25, length: 100 },
      material: 'Aluminum',
      tolerance: '±0.05mm',
      quantity: 5
    },
    {
      dimensions: { length: 200, width: 100, thickness: 5 },
      material: 'Stainless Steel',
      tolerance: '±0.2mm',
      quantity: 20
    }
  ];
  
  const specs = sampleSpecs[Math.floor(Math.random() * sampleSpecs.length)];
  
  const recommendationRes = http.post(`${BASE_URL}/api/recommendations`, 
    JSON.stringify({ extractedSpecs: specs }), 
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'recommendations_api' },
    }
  );
  
  recommendationApiDuration.add(recommendationRes.timings.duration);
  requestCount.add(1);
  
  const recommendationSuccess = check(recommendationRes, {
    'recommendations status 200': (r) => r.status === 200,
    'recommendations returns object': (r) => {
      try {
        const body = r.json();
        return typeof body === 'object' && (body.recommendations || body.matches);
      } catch {
        return false;
      }
    },
    'recommendations response time acceptable': (r) => r.timings.duration < 3000,
  });
  
  recommendationApiSuccessRate.add(recommendationSuccess ? 1 : 0);
  appSuccessRate.add(recommendationSuccess ? 1 : 0);
  
  if (!recommendationSuccess) {
    apiErrorCount.add(1);
  }
  
  // Test alternative recommendations if main recommendation works
  if (recommendationSuccess && Math.random() < 0.4) {
    sleep(0.5);
    
    const alternativeRes = http.post(`${BASE_URL}/api/recommendations/alternatives`, 
      JSON.stringify({ 
        originalSpecs: specs,
        reason: 'exact_match_not_found'
      }), 
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'alternatives_api' },
      }
    );
    
    recommendationApiDuration.add(alternativeRes.timings.duration);
    requestCount.add(1);
    
    const alternativeSuccess = check(alternativeRes, {
      'alternatives status 200': (r) => r.status === 200,
      'alternatives response time acceptable': (r) => r.timings.duration < 2500,
    });
    
    recommendationApiSuccessRate.add(alternativeSuccess ? 1 : 0);
    appSuccessRate.add(alternativeSuccess ? 1 : 0);
    
    if (!alternativeSuccess) {
      apiErrorCount.add(1);
    }
  }
}

export function setup() {
  console.log('Starting application endpoint SMOKE test');
  console.log(`Target: ${BASE_URL}`);
  console.log('Testing: Products API, Categories API, Recommendations API');
  console.log('Duration: 3 minutes (peak: 10 concurrent users)');
  console.log('Scenarios: Products (40%), Categories (30%), Recommendations (30%)');
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log(`Application endpoint smoke test completed. Started: ${data.startTime}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log('Check metrics for application API performance');
}