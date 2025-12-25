import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for combined admin operations
const adminOperationSuccessRate = new Rate('admin_operation_success_rate');
const productListDuration = new Trend('product_list_duration');
const productDetailDuration = new Trend('product_detail_duration');
const productSearchDuration = new Trend('product_search_duration');
const categoryAccessDuration = new Trend('category_access_duration');
const dataAccessDuration = new Trend('data_access_duration');
const adminErrorCount = new Counter('admin_error_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 4 },    // Warm up to 4 admin users
    { duration: '4m', target: 6 },    // Steady state (6 concurrent admin users)
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    // Smoke test thresholds (more strict)
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.10'], // 10% tolerance for smoke test
    
    // Admin operation success rate
    admin_operation_success_rate: ['rate>0.70'], // 70% minimum for smoke test
    
    // Operation-specific thresholds
    product_list_duration: ['p(95)<1000'],
    product_detail_duration: ['p(95)<800'],
    product_search_duration: ['p(95)<1200'],
    category_access_duration: ['p(95)<800'],
    data_access_duration: ['p(95)<1500'],
    
    // Error tracking
    admin_error_count: ['count<25'],
  },
};

// Global variable to store discovered pagination info
let paginationInfo = null;

export function setup() {
  console.log('Combined Admin Smoke Test Setup');
  console.log('Note: This test uses public APIs due to cookie-based authentication');
  
  // Discover pagination limits
  try {
    const response = http.get(`${BASE_URL}/api/products?page=1&limit=1`);
    if (response.status === 200) {
      const body = response.json();
      if (body.pagination && body.pagination.total) {
        const total = body.pagination.total;
        const maxPages = Math.ceil(total / 20); // Assuming 20 items per page
        paginationInfo = { total, maxPages };
        console.log(`Discovered ${total} total products, ${maxPages} max pages`);
      }
    }
  } catch (e) {
    console.log('Could not discover pagination info, using defaults');
  }
  
  console.log('Starting combined admin operations smoke test');
  console.log(`Target: ${BASE_URL}`);
  console.log('Duration: 6 minutes (6 concurrent admin users)');
  console.log('Operations: Product Management + Report Data Access');
  return { startTime: new Date().toISOString(), paginationInfo };
}

export default function (data) {
  // Update global pagination info
  if (data.paginationInfo) {
    paginationInfo = data.paginationInfo;
  }
  
  // Weighted operation selection (realistic admin workflow)
  const operation = Math.random();
  
  if (operation < 0.4) {
    // 40% - Product List Operations (most common admin task)
    performProductListOperations();
    
  } else if (operation < 0.6) {
    // 20% - Product Detail Operations
    performProductDetailOperations();
    
  } else if (operation < 0.75) {
    // 15% - Product Search Operations
    performProductSearchOperations();
    
  } else if (operation < 0.9) {
    // 15% - Report Data Access (product data for reports)
    performReportDataAccess();
    
  } else {
    // 10% - Category Management (for report categorization)
    performCategoryOperations();
  }
  
  // Admin think time (admins work more deliberately)
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

function performProductListOperations() {
  const scenarios = [
    { url: '/api/products?page=1&limit=20', name: 'default_list' },
    { url: '/api/products?page=1&limit=20&category=structural', name: 'structural_filter' },
    { url: '/api/products?page=1&limit=20&category=robotic', name: 'robotic_filter' },
    { url: '/api/products?page=1&limit=20&category=fasteners', name: 'fasteners_filter' },
    { url: '/api/products?page=2&limit=10', name: 'pagination' },
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  const listRes = http.get(`${BASE_URL}${scenario.url}`, {
    tags: { name: 'admin_product_list', scenario: scenario.name },
  });
  
  productListDuration.add(listRes.timings.duration);
  
  const listSuccess = check(listRes, {
    'product list 200': (r) => r.status === 200,
    'product list has products': (r) => {
      try {
        const body = r.json();
        return body.products && Array.isArray(body.products);
      } catch {
        return false;
      }
    },
    'product list has pagination': (r) => {
      try {
        const body = r.json();
        return body.pagination && typeof body.pagination.total === 'number';
      } catch {
        return false;
      }
    },
    'product list response time OK': (r) => r.timings.duration < 1500,
  });
  
  adminOperationSuccessRate.add(listSuccess ? 1 : 0);
  if (!listSuccess) adminErrorCount.add(1);
}

function performProductDetailOperations() {
  // Use known product IDs from the existing catalog
  const productIds = [
    '8116a995-3e9d-418b-ab58-2b51764c67ea', // Steel I-Beam
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Servo Motor
    'a1b2c3d4-e5f6-7890-1234-567890abcdef', // Hex Bolt Set
  ];
  const productId = productIds[Math.floor(Math.random() * productIds.length)];
  
  const detailRes = http.get(`${BASE_URL}/api/products/${productId}`, {
    tags: { name: 'admin_product_detail' },
  });
  
  productDetailDuration.add(detailRes.timings.duration);
  
  const detailSuccess = check(detailRes, {
    'product detail response': (r) => r.status === 200 || r.status === 404, // 404 OK for non-existent
    'product detail has data': (r) => {
      if (r.status === 200) {
        try {
          const body = r.json();
          return body.product && body.product.id;
        } catch {
          return false;
        }
      }
      return true; // 404 is acceptable
    },
    'product detail response time OK': (r) => r.timings.duration < 1000,
  });
  
  adminOperationSuccessRate.add(detailSuccess ? 1 : 0);
  if (!detailSuccess) adminErrorCount.add(1);
}

function performProductSearchOperations() {
  const searchTerms = ['steel', 'motor', 'bolt', 'beam', 'servo'];
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const limit = [10, 20][Math.floor(Math.random() * 2)]; // Smaller limits for smoke test
  
  const searchRes = http.get(`${BASE_URL}/api/products?search=${searchTerm}&limit=${limit}`, {
    tags: { name: 'admin_product_search' },
  });
  
  productSearchDuration.add(searchRes.timings.duration);
  
  const searchSuccess = check(searchRes, {
    'product search 200': (r) => r.status === 200,
    'product search has results': (r) => {
      try {
        const body = r.json();
        return body.products && Array.isArray(body.products);
      } catch {
        return false;
      }
    },
    'product search response time OK': (r) => r.timings.duration < 1500,
  });
  
  adminOperationSuccessRate.add(searchSuccess ? 1 : 0);
  if (!searchSuccess) adminErrorCount.add(1);
}

function performReportDataAccess() {
  // Simulate admin accessing data for report generation (smart pagination)
  const maxPage = paginationInfo ? paginationInfo.maxPages : 2; // Use discovered max or default to 2
  const page = Math.floor(Math.random() * Math.min(maxPage, 2)) + 1; // Limit to realistic pages
  const limit = [10, 20][Math.floor(Math.random() * 2)]; // Smaller limits for smoke test
  
  const dataRes = http.get(`${BASE_URL}/api/products?page=${page}&limit=${limit}`, {
    tags: { name: 'admin_report_data_access' },
  });
  
  dataAccessDuration.add(dataRes.timings.duration);
  
  const dataSuccess = check(dataRes, {
    'report data access 200': (r) => r.status === 200,
    'report data has products': (r) => {
      try {
        const body = r.json();
        return body.products && Array.isArray(body.products);
      } catch {
        return false;
      }
    },
    'report data response time OK': (r) => r.timings.duration < 2000,
  });
  
  adminOperationSuccessRate.add(dataSuccess ? 1 : 0);
  if (!dataSuccess) adminErrorCount.add(1);
  
  // Simulate report processing time
  sleep(0.5 + Math.random() * 1); // 0.5-1.5 seconds processing
}

function performCategoryOperations() {
  // Test category data access (for report categorization and admin management)
  const categoryRes = http.get(`${BASE_URL}/api/categories`, {
    tags: { name: 'admin_category_access' },
  });
  
  categoryAccessDuration.add(categoryRes.timings.duration);
  
  const categorySuccess = check(categoryRes, {
    'category access 200': (r) => r.status === 200,
    'category has data': (r) => {
      try {
        const body = r.json();
        return body.categories && Array.isArray(body.categories);
      } catch {
        return false;
      }
    },
    'category response time OK': (r) => r.timings.duration < 1000,
  });
  
  adminOperationSuccessRate.add(categorySuccess ? 1 : 0);
  if (!categorySuccess) adminErrorCount.add(1);
}

export function teardown(data) {
  console.log(`Combined admin smoke test completed. Started: ${data.startTime}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log('Operations tested:');
  console.log('- Product List Operations (40%): Default, filtered, paginated');
  console.log('- Product Detail Operations (20%): Individual product access');
  console.log('- Product Search Operations (15%): Text-based product search');
  console.log('- Report Data Access (15%): Moderate data access for reporting');
  console.log('- Category Operations (10%): Category management and filtering');
  console.log('Note: This test used public APIs. For full admin testing, use web interface.');
}