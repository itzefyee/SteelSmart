import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for detailed performance tracking
const cacheHitRate = new Rate('cache_hit_rate');
const productListDuration = new Trend('product_list_duration');
const productDetailDuration = new Trend('product_detail_duration');
const recommendationDuration = new Trend('recommendation_duration');

// Base URL can be overridden with `BASE_URL=http://host:port k6 run ...`
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // ramp up
    { duration: '2m', target: 10 },  // steady state
    { duration: '30s', target: 0 },  // ramp down
  ],
  thresholds: {
    // Overall thresholds
    http_req_duration: ['p(95)<1000', 'p(99)<1500'],
    http_req_failed: ['rate<0.02'], // <2% errors
    
    // Endpoint-specific thresholds (relaxed p99 for edge cases)
    'product_list_duration': ['p(95)<500', 'p(99)<1000'],
    'product_detail_duration': ['p(95)<600', 'p(99)<1000'],
    'recommendation_duration': ['p(95)<800', 'p(99)<1500'],
    
    // Cache performance
    'cache_hit_rate': ['rate>0.7'], // >70% cache hit rate after warmup
  },
};

export default function () {
  // Scenario 1: List products with various filters
  const scenarios = [
    { url: '/api/products?page=1&limit=20', name: 'default' },
    { url: '/api/products?page=1&limit=20&category=structural', name: 'structural' },
    { url: '/api/products?page=1&limit=20&category=robotic', name: 'robotic' },
    { url: '/api/products?page=1&limit=20&category=fasteners', name: 'fasteners' },
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  const listRes = http.get(`${BASE_URL}${scenario.url}`);
  
  // Track product list performance
  productListDuration.add(listRes.timings.duration);
  
  // Check for cache headers
  const cacheControl = listRes.headers['Cache-Control'] || '';
  const isCached = cacheControl.includes('s-maxage') || listRes.timings.duration < 200;
  cacheHitRate.add(isCached ? 1 : 0);

  let products = [];
  try {
    const body = listRes.json();
    if (body && body.products && Array.isArray(body.products)) {
      products = body.products;
    }
  } catch (_err) {
    // Leave products empty; checks will capture failures.
  }

  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list has products': () => products.length > 0,
    'list has pagination': (r) => {
      try {
        const body = r.json();
        return body.pagination && typeof body.pagination.total === 'number';
      } catch {
        return false;
      }
    },
    'list response time OK': (r) => r.timings.duration < 1000,
  });

  // Scenario 2: View product details (80% of users)
  if (products.length > 0 && Math.random() < 0.8) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const detailRes = http.get(`${BASE_URL}/api/products/${randomProduct.id}`);
    
    productDetailDuration.add(detailRes.timings.duration);
    
    check(detailRes, {
      'detail status 200': (r) => r.status === 200,
      'detail has product data': (r) => {
        try {
          const body = r.json();
          return body && body.product && body.product.id && body.product.name;
        } catch {
          return false;
        }
      },
      'detail response time OK': (r) => r.timings.duration < 1500,
    });
    
    sleep(1); // User reads product details
    
    // Scenario 3: Get recommendations (50% of detail viewers)
    if (Math.random() < 0.5) {
      const recRes = http.get(`${BASE_URL}/api/recommendations?productId=${randomProduct.id}`);
      
      recommendationDuration.add(recRes.timings.duration);
      
      check(recRes, {
        'recs status 200': (r) => r.status === 200,
        'recs has data': (r) => {
          try {
            const body = r.json();
            return body && body.success === true && body.data;
          } catch {
            return false;
          }
        },
        'recs response time OK': (r) => r.timings.duration < 1500,
      });
      
      sleep(0.5); // User reviews recommendations
    }
  }

  // Think time - simulate user reading/browsing
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}











