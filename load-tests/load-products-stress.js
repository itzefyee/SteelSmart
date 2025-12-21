import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for detailed performance tracking
const cacheHitRate = new Rate('cache_hit_rate');
const productListDuration = new Trend('product_list_duration');
const productDetailDuration = new Trend('product_detail_duration');
const recommendationDuration = new Trend('recommendation_duration');
const cadAnalysisDuration = new Trend('cad_analysis_duration');
const errorCount = new Counter('error_count');

// Base URL can be overridden with `BASE_URL=http://host:port k6 run ...`
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm up to 20 users
    { duration: '2m', target: 50 },   // Ramp to 50 users
    { duration: '3m', target: 100 },  // Ramp to 100 users
    { duration: '5m', target: 100 },  // Hold at 100 users (stress test)
    { duration: '2m', target: 50 },   // Ramp down to 50
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    // Overall thresholds (more lenient for 100 users)
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'], // <5% errors acceptable under stress
    
    // Endpoint-specific thresholds
    'product_list_duration': ['p(95)<1000', 'p(99)<1500'],
    'product_detail_duration': ['p(95)<1200', 'p(99)<2000'],
    'recommendation_duration': ['p(95)<1500', 'p(99)<2500'],
    'cad_analysis_duration': ['p(95)<3000', 'p(99)<5000'],
    
    // Cache performance (should still be good under load)
    'cache_hit_rate': ['rate>0.6'], // >60% cache hit rate under stress
    
    // Error tracking
    'error_count': ['count<100'], // Less than 100 total errors
  },
};

export default function () {
  // Scenario 1: List products with various filters (100% of users)
  const scenarios = [
    { url: '/api/products?page=1&limit=20', name: 'default', weight: 0.4 },
    { url: '/api/products?page=1&limit=20&category=structural-steel', name: 'category-filter', weight: 0.25 },
    { url: '/api/products?page=1&limit=20&minPrice=100&maxPrice=1000', name: 'price-filter', weight: 0.2 },
    { url: '/api/products?page=1&limit=20&search=steel', name: 'search', weight: 0.15 },
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  const listRes = http.get(`${BASE_URL}${scenario.url}`, {
    tags: { name: 'product_list', scenario: scenario.name },
  });
  
  // Track product list performance
  productListDuration.add(listRes.timings.duration);
  
  // Check for cache headers
  const cacheControl = listRes.headers['Cache-Control'] || '';
  const isCached = cacheControl.includes('s-maxage') || listRes.timings.duration < 200;
  cacheHitRate.add(isCached ? 1 : 0);

  let products = [];
  const listSuccess = check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list has products': (r) => {
      try {
        const body = r.json();
        if (body && body.products && Array.isArray(body.products)) {
          products = body.products;
          return products.length > 0;
        }
        return false;
      } catch {
        return false;
      }
    },
    'list has pagination': (r) => {
      try {
        const body = r.json();
        return body.pagination && typeof body.pagination.total === 'number';
      } catch {
        return false;
      }
    },
    'list response time OK': (r) => r.timings.duration < 2000,
  });

  if (!listSuccess) {
    errorCount.add(1);
  }

  // Scenario 2: View product details (75% of users)
  if (products.length > 0 && Math.random() < 0.75) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const detailRes = http.get(`${BASE_URL}/api/products/${randomProduct.id}`, {
      tags: { name: 'product_detail' },
    });
    
    productDetailDuration.add(detailRes.timings.duration);
    
    const detailSuccess = check(detailRes, {
      'detail status 200': (r) => r.status === 200,
      'detail has product data': (r) => {
        try {
          const body = r.json();
          return body && body.product && body.product.id && body.product.name;
        } catch {
          return false;
        }
      },
      'detail response time OK': (r) => r.timings.duration < 2500,
    });
    
    if (!detailSuccess) {
      errorCount.add(1);
    }
    
    sleep(0.5 + Math.random() * 1); // User reads product details (0.5-1.5s)
    
    // Scenario 3: Get recommendations (60% of detail viewers)
    if (Math.random() < 0.6) {
      const recRes = http.get(`${BASE_URL}/api/recommendations?productId=${randomProduct.id}`, {
        tags: { name: 'recommendations' },
      });
      
      recommendationDuration.add(recRes.timings.duration);
      
      const recSuccess = check(recRes, {
        'recs status 200': (r) => r.status === 200,
        'recs has data': (r) => {
          try {
            const body = r.json();
            return body && body.success === true && body.data;
          } catch {
            return false;
          }
        },
        'recs response time OK': (r) => r.timings.duration < 3000,
      });
      
      if (!recSuccess) {
        errorCount.add(1);
      }
      
      sleep(0.3 + Math.random() * 0.5); // User reviews recommendations (0.3-0.8s)
    }
  }

  // Scenario 4: Pagination browsing (30% of users)
  if (Math.random() < 0.3) {
    const page = Math.floor(Math.random() * 3) + 2; // Pages 2-4
    const paginationRes = http.get(`${BASE_URL}/api/products?page=${page}&limit=20`, {
      tags: { name: 'pagination' },
    });
    
    check(paginationRes, {
      'pagination status 200': (r) => r.status === 200,
      'pagination response time OK': (r) => r.timings.duration < 2000,
    });
    
    sleep(0.5); // Quick browse
  }

  // Scenario 5: Multiple category browsing (20% of users)
  if (Math.random() < 0.2) {
    const categories = ['structural-steel', 'fasteners', 'robotic-components', 'custom-parts'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    const categoryRes = http.get(`${BASE_URL}/api/products?category=${randomCategory}&limit=20`, {
      tags: { name: 'category_browse' },
    });
    
    check(categoryRes, {
      'category status 200': (r) => r.status === 200,
      'category response time OK': (r) => r.timings.duration < 2000,
    });
    
    sleep(0.8); // Browse category
  }

  // Think time - simulate realistic user behavior
  // Shorter think times under stress to maximize load
  sleep(Math.random() * 1.5 + 0.5); // 0.5-2 seconds
}

// Setup function - runs once per VU at start
export function setup() {
  console.log(`Starting stress test with 100 concurrent users`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration: 14 minutes total (5 minutes at peak load)`);
  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once at end
export function teardown(data) {
  console.log(`Stress test completed. Started at: ${data.startTime}`);
  console.log(`Finished at: ${new Date().toISOString()}`);
}
