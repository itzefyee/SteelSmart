import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for combined admin stress testing
const adminOperationSuccessRate = new Rate('admin_operation_success_rate');
const productListDuration = new Trend('product_list_duration');
const productDetailDuration = new Trend('product_detail_duration');
const productSearchDuration = new Trend('product_search_duration');
const categoryAccessDuration = new Trend('category_access_duration');
const dataAccessDuration = new Trend('data_access_duration');
const concurrentOperationCount = new Counter('concurrent_operation_count');
const adminErrorCount = new Counter('admin_error_count');
const bulkOperationCount = new Counter('bulk_operation_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 6 },    // Warm up to 6 admin users
    { duration: '3m', target: 12 },   // Ramp to realistic peak (12 users)
    { duration: '4m', target: 15 },   // Stress peak (15 concurrent admin users)
    { duration: '2m', target: 0 },    // Cool down
  ],
  thresholds: {
    // Stress test thresholds (more lenient)
    http_req_duration: ['p(95)<4000', 'p(99)<8000'],
    http_req_failed: ['rate<0.20'], // 20% tolerance for stress test
    
    // Admin operation success rate under stress
    admin_operation_success_rate: ['rate>0.60'], // 60% minimum under stress
    
    // Operation-specific thresholds under stress
    product_list_duration: ['p(95)<2000', 'p(99)<4000'],
    product_detail_duration: ['p(95)<1500', 'p(99)<3000'],
    product_search_duration: ['p(95)<2500', 'p(99)<5000'],
    category_access_duration: ['p(95)<1500', 'p(99)<3000'],
    data_access_duration: ['p(95)<3000', 'p(99)<6000'],
    
    // Error tracking
    admin_error_count: ['count<100'], // Allow more errors under stress
  },
};

export function setup() {
  console.log('Combined Admin STRESS Test Setup');
  console.log('Note: This test uses public APIs due to cookie-based authentication');
  console.log('Starting combined admin operations STRESS test');
  console.log(`Target: ${BASE_URL}`);
  console.log('Duration: 10 minutes (peak: 15 concurrent admin users)');
  console.log('Operations: Product Management + Report Data Access + Bulk Operations');
  return { startTime: new Date().toISOString() };
}

export default function (data) {
  // Weighted operation selection (stress test scenarios)
  const operation = Math.random();
  
  if (operation < 0.35) {
    // 35% - Product List Operations (most common admin task)
    performProductListOperations();
    
  } else if (operation < 0.55) {
    // 20% - Product Detail Operations
    performProductDetailOperations();
    
  } else if (operation < 0.7) {
    // 15% - Product Search Operations
    performProductSearchOperations();
    
  } else if (operation < 0.85) {
    // 15% - Bulk Report Data Access (stress scenario)
    performBulkReportDataAccess();
    
  } else if (operation < 0.95) {
    // 10% - Category Operations with bulk access
    performBulkCategoryOperations();
    
  } else {
    // 5% - Rapid concurrent operations (stress scenario)
    performRapidConcurrentOperations();
  }
  
  // Shorter think time under stress
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function performProductListOperations() {
  const scenarios = [
    { url: '/api/products?page=1&limit=20', name: 'large_default_list' },
    { url: '/api/products?page=1&limit=50', name: 'extra_large_default_list' },
    { url: '/api/products?page=1&limit=50&category=structural', name: 'large_structural_filter' },
    { url: '/api/products?page=1&limit=50&category=robotic', name: 'large_robotic_filter' },
    { url: '/api/products?page=1&limit=50&category=fasteners', name: 'large_fasteners_filter' },
    { url: '/api/products?page=2&limit=10', name: 'realistic_pagination' }, // Only page 2 exists
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  const listRes = http.get(`${BASE_URL}${scenario.url}`, {
    tags: { name: 'admin_product_list_stress', scenario: scenario.name },
  });
  
  productListDuration.add(listRes.timings.duration);
  
  const listSuccess = check(listRes, {
    'stress product list response': (r) => r.status === 200,
    'stress product list has data': (r) => {
      try {
        const body = r.json();
        return body.products && Array.isArray(body.products);
      } catch {
        return false;
      }
    },
    'stress product list response time acceptable': (r) => r.timings.duration < 3000,
  });
  
  adminOperationSuccessRate.add(listSuccess ? 1 : 0);
  if (!listSuccess) adminErrorCount.add(1);
}

function performProductDetailOperations() {
  // Stress test: Multiple rapid detail requests
  const productIds = [
    '8116a995-3e9d-418b-ab58-2b51764c67ea', // Steel I-Beam
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Servo Motor
    'a1b2c3d4-e5f6-7890-1234-567890abcdef', // Hex Bolt Set
    '550e8400-e29b-41d4-a716-446655440000', // Custom Bracket
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Steel Plate
  ];
  
  const requestCount = Math.floor(Math.random() * 2) + 1; // 1-2 requests
  
  for (let i = 0; i < requestCount; i++) {
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    
    const detailRes = http.get(`${BASE_URL}/api/products/${productId}`, {
      tags: { name: 'admin_product_detail_stress' },
    });
    
    productDetailDuration.add(detailRes.timings.duration);
    concurrentOperationCount.add(1);
    
    const detailSuccess = check(detailRes, {
      'stress product detail response': (r) => r.status === 200 || r.status === 404,
      'stress product detail response time acceptable': (r) => r.timings.duration < 2000,
    });
    
    adminOperationSuccessRate.add(detailSuccess ? 1 : 0);
    if (!detailSuccess) adminErrorCount.add(1);
    
    // Brief pause between rapid requests
    if (i < requestCount - 1) {
      sleep(0.2);
    }
  }
}

function performProductSearchOperations() {
  const searchTerms = ['steel', 'motor', 'bolt', 'beam', 'servo', 'bracket', 'plate', 'fastener', 'aluminum', 'custom'];
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const limit = [20, 50, 100][Math.floor(Math.random() * 3)]; // Larger limits for stress test
  
  const searchRes = http.get(`${BASE_URL}/api/products?search=${searchTerm}&limit=${limit}`, {
    tags: { name: 'admin_product_search_stress' },
  });
  
  productSearchDuration.add(searchRes.timings.duration);
  
  const searchSuccess = check(searchRes, {
    'stress product search response': (r) => r.status === 200,
    'stress product search response time acceptable': (r) => r.timings.duration < 3000,
  });
  
  adminOperationSuccessRate.add(searchSuccess ? 1 : 0);
  if (!searchSuccess) adminErrorCount.add(1);
}

function performBulkReportDataAccess() {
  // Stress scenario: Bulk data access for large reports (realistic pagination)
  // With ~22 total products, only pages 1-2 have data
  const operations = Math.floor(Math.random() * 2) + 1; // 1-2 operations (reduced for realistic data)
  bulkOperationCount.add(operations);
  
  for (let i = 0; i < operations; i++) {
    const page = Math.floor(Math.random() * 2) + 1; // Pages 1-2 only
    const limit = [20, 50][Math.floor(Math.random() * 2)]; // Realistic limits
    
    const dataRes = http.get(`${BASE_URL}/api/products?page=${page}&limit=${limit}`, {
      tags: { name: 'admin_bulk_report_data_access' },
    });
    
    dataAccessDuration.add(dataRes.timings.duration);
    concurrentOperationCount.add(1);
    
    const dataSuccess = check(dataRes, {
      'stress bulk data access response': (r) => r.status === 200,
      'stress bulk data has products': (r) => {
        try {
          const body = r.json();
          return body.products && Array.isArray(body.products);
        } catch {
          return false;
        }
      },
      'stress bulk data response time acceptable': (r) => r.timings.duration < 4000,
    });
    
    adminOperationSuccessRate.add(dataSuccess ? 1 : 0);
    if (!dataSuccess) adminErrorCount.add(1);
    
    // Brief pause between bulk operations
    if (i < operations - 1) {
      sleep(0.3);
    }
  }
  
  // Simulate bulk report processing time
  sleep(1 + Math.random() * 3); // 1-4 seconds processing
}

function performBulkCategoryOperations() {
  // Stress test: Category access with subsequent bulk product access
  const categoryRes = http.get(`${BASE_URL}/api/categories`, {
    tags: { name: 'admin_category_access_stress' },
  });
  
  categoryAccessDuration.add(categoryRes.timings.duration);
  
  const categorySuccess = check(categoryRes, {
    'stress category access response': (r) => r.status === 200,
    'stress category response time acceptable': (r) => r.timings.duration < 2000,
  });
  
  adminOperationSuccessRate.add(categorySuccess ? 1 : 0);
  if (!categorySuccess) adminErrorCount.add(1);
  
  // If categories loaded successfully, perform bulk category-specific access
  if (categorySuccess) {
    try {
      const body = categoryRes.json();
      const categories = body.categories;
      
      if (categories && categories.length > 0) {
        // Access multiple categories rapidly (stress scenario)
        const categoryCount = Math.min(categories.length, Math.floor(Math.random() * 3) + 2); // 2-4 categories
        
        for (let i = 0; i < categoryCount; i++) {
          const randomCategory = categories[Math.floor(Math.random() * categories.length)];
          
          sleep(0.2); // Brief pause
          
          const categoryProductRes = http.get(`${BASE_URL}/api/products?category=${randomCategory.id}&limit=50`, {
            tags: { name: 'admin_bulk_category_products' },
          });
          
          productListDuration.add(categoryProductRes.timings.duration);
          concurrentOperationCount.add(1);
          
          const categoryProductSuccess = check(categoryProductRes, {
            'stress category products response': (r) => r.status === 200 || r.status === 404,
            'stress category products response time acceptable': (r) => r.timings.duration < 3000,
          });
          
          adminOperationSuccessRate.add(categoryProductSuccess ? 1 : 0);
          if (!categoryProductSuccess) adminErrorCount.add(1);
        }
      }
    } catch (e) {
      // Ignore parsing errors under stress
      adminErrorCount.add(1);
    }
  }
}

function performRapidConcurrentOperations() {
  // Stress scenario: Rapid fire multiple operations simultaneously
  const operations = [
    () => http.get(`${BASE_URL}/api/products?page=1&limit=20`, { tags: { name: 'rapid_product_list' } }),
    () => http.get(`${BASE_URL}/api/categories`, { tags: { name: 'rapid_category_access' } }),
    () => http.get(`${BASE_URL}/api/products?search=steel&limit=10`, { tags: { name: 'rapid_product_search' } }),
  ];
  
  const operationCount = Math.floor(Math.random() * 3) + 2; // 2-4 rapid operations
  concurrentOperationCount.add(operationCount);
  
  for (let i = 0; i < operationCount; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const response = operation();
    
    const rapidSuccess = check(response, {
      'rapid operation response': (r) => r.status === 200 || r.status === 404,
      'rapid operation response time acceptable': (r) => r.timings.duration < 2000,
    });
    
    adminOperationSuccessRate.add(rapidSuccess ? 1 : 0);
    if (!rapidSuccess) adminErrorCount.add(1);
    
    // Very brief pause between rapid operations
    if (i < operationCount - 1) {
      sleep(0.1);
    }
  }
}

export function teardown(data) {
  console.log(`Combined admin STRESS test completed. Started: ${data.startTime}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log('Stress scenarios tested:');
  console.log('- Product List Operations (35%): Large datasets, deep pagination');
  console.log('- Product Detail Operations (20%): Multiple rapid requests');
  console.log('- Product Search Operations (15%): Large result sets');
  console.log('- Bulk Report Data Access (15%): Large data pulls for reporting');
  console.log('- Bulk Category Operations (10%): Multiple category access');
  console.log('- Rapid Concurrent Operations (5%): Simultaneous rapid requests');
  console.log('Peak load: 15 concurrent admin users');
  console.log('Check memory usage and database performance metrics');
}