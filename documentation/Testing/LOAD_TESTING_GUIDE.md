# Load Testing Guide for SteelSmart

## Overview

Load testing helps you understand how your application performs under various levels of concurrent users and requests. This guide covers strategies, tools, and best practices for load testing your SteelSmart AI marketplace.

---

## Why Load Test?

### Key Benefits
1. **Identify bottlenecks** - Find slow endpoints before users do
2. **Validate caching** - Ensure Redis caching works under load
3. **Test scalability** - Verify the system can handle growth
4. **Measure response times** - Ensure SLAs are met
5. **Prevent crashes** - Find breaking points before production
6. **Optimize costs** - Right-size your infrastructure

### What to Test
- API endpoints (products, CAD generation, analysis)
- Database queries (Supabase)
- External API calls (Gemini, Zoo Dev)
- Caching layer (Redis)
- File uploads (technical drawings)
- Authentication flows

---

## Load Testing Tools

### 1. **k6** (Recommended) ⭐

**Why k6?**
- Modern, developer-friendly
- JavaScript-based test scripts
- Excellent reporting
- Cloud and local execution
- Free and open-source

**Best For:**
- API load testing
- Performance regression testing
- CI/CD integration

**Installation:**
```bash
# Windows (via Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Example Test Scenario:**
```javascript
// load-test-products.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  // Test product listing
  const res = http.get('http://localhost:3000/api/products?page=1&limit=20');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has products': (r) => JSON.parse(r.body).products.length > 0,
  });
  
  sleep(1); // Think time between requests
}
```

**Run Test:**
```bash
k6 run load-test-products.js
```

---

### 2. **Apache JMeter**

**Why JMeter?**
- Industry standard
- GUI for test creation
- Extensive plugins
- Detailed reports

**Best For:**
- Complex test scenarios
- Non-technical testers
- Enterprise environments

**Installation:**
- Download from: https://jmeter.apache.org/download_jmeter.cgi
- Requires Java JDK

**Test Plan Structure:**
```
Test Plan
├── Thread Group (Users)
│   ├── HTTP Request (GET /api/products)
│   ├── HTTP Request (POST /api/analyze-drawing)
│   └── Assertions
├── Listeners (Results)
│   ├── View Results Tree
│   ├── Summary Report
│   └── Aggregate Report
└── Config Elements
    └── HTTP Request Defaults
```

---

### 3. **Artillery**

**Why Artillery?**
- Simple YAML configuration
- Built-in scenarios
- Good for CI/CD

**Best For:**
- Quick load tests
- Automated testing
- Simple scenarios

**Installation:**
```bash
npm install -g artillery
```

**Example Config:**
```yaml
# artillery-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
  
scenarios:
  - name: "Browse products"
    flow:
      - get:
          url: "/api/products?page=1&limit=20"
      - think: 2
      - get:
          url: "/api/categories"
```

**Run Test:**
```bash
artillery run artillery-test.yml
```

---

### 4. **Locust**

**Why Locust?**
- Python-based
- Real-time web UI
- Distributed testing

**Best For:**
- Python developers
- Complex user behaviors
- Distributed load generation

**Installation:**
```bash
pip install locust
```

**Example Test:**
```python
# locustfile.py
from locust import HttpUser, task, between

class SteelSmartUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def browse_products(self):
        self.client.get("/api/products?page=1&limit=20")
    
    @task(1)
    def view_product(self):
        self.client.get("/api/products/1")
    
    @task(1)
    def get_recommendations(self):
        self.client.get("/api/recommendations?productId=1")
```

**Run Test:**
```bash
locust -f locustfile.py --host=http://localhost:3000
# Open http://localhost:8089 in browser
```

---

### 5. **Gatling**

**Why Gatling?**
- Scala-based
- Beautiful reports
- High performance

**Best For:**
- Large-scale tests
- Performance engineers
- Detailed analytics

---

## Load Testing Strategy

### Phase 1: Baseline Testing (Week 1)

**Goal:** Establish performance baseline

**Tests:**
1. **Single User Test**
   - 1 user, all endpoints
   - Measure response times
   - Identify slow endpoints

2. **Smoke Test**
   - 5-10 concurrent users
   - 5 minutes duration
   - Verify system stability

**Metrics to Collect:**
- Average response time
- 95th percentile response time
- Error rate
- Throughput (requests/second)

---

### Phase 2: Load Testing (Week 2)

**Goal:** Test under expected load

**Tests:**
1. **Normal Load Test**
   - Expected concurrent users (e.g., 50 users)
   - 30 minutes duration
   - Realistic user behavior

2. **Peak Load Test**
   - 2x expected load (e.g., 100 users)
   - 15 minutes duration
   - Simulate peak hours

**Scenarios to Test:**

#### Scenario 1: Product Browsing
```
User Flow:
1. GET /api/products (list)
2. Wait 2-3 seconds
3. GET /api/products/[id] (detail)
4. Wait 3-5 seconds
5. GET /api/recommendations?productId=[id]
6. Repeat
```

#### Scenario 2: CAD Analysis
```
User Flow:
1. POST /api/analyze-drawing (with file)
2. Wait for response (may take 10-30 seconds)
3. GET /api/products (view recommendations)
4. Wait 5 seconds
```

#### Scenario 3: CAD Generation
```
User Flow:
1. POST /api/generate-cad (with description)
2. Poll for completion (may take 2-5 minutes)
3. GET /api/cad-history
4. Wait 10 seconds
```

---

### Phase 3: Stress Testing (Week 3)

**Goal:** Find breaking point

**Tests:**
1. **Stress Test**
   - Gradually increase load until system breaks
   - Start: 50 users
   - Increment: +50 users every 5 minutes
   - Stop: When error rate > 5% or response time > 5s

2. **Spike Test**
   - Sudden traffic spike
   - 0 → 200 users in 30 seconds
   - Hold for 2 minutes
   - Test recovery

---

### Phase 4: Endurance Testing (Week 4)

**Goal:** Test stability over time

**Tests:**
1. **Soak Test**
   - Moderate load (50 users)
   - Extended duration (4-8 hours)
   - Check for memory leaks
   - Monitor resource usage

---

## Key Endpoints to Test

### Priority 1: Critical Paths

| Endpoint | Method | Expected Load | Target Response Time |
|----------|--------|---------------|---------------------|
| `/api/products` | GET | High | < 200ms (cached) |
| `/api/products/[id]` | GET | High | < 300ms |
| `/api/categories` | GET | Medium | < 100ms (cached) |
| `/api/recommendations` | GET | Medium | < 500ms |

### Priority 2: Heavy Operations

| Endpoint | Method | Expected Load | Target Response Time |
|----------|--------|---------------|---------------------|
| `/api/analyze-drawing` | POST | Low | < 30s |
| `/api/generate-cad` | POST | Low | < 5min |
| `/api/submit-rfq` | POST | Low | < 2s |

### Priority 3: Authentication

| Endpoint | Method | Expected Load | Target Response Time |
|----------|--------|---------------|---------------------|
| `/api/auth/profile` | GET | Medium | < 300ms |
| `/api/auth/profile` | PUT | Low | < 500ms |

---

## Metrics to Monitor

### Application Metrics

1. **Response Time**
   - Average
   - Median (p50)
   - 95th percentile (p95)
   - 99th percentile (p99)
   - Max

2. **Throughput**
   - Requests per second (RPS)
   - Successful requests
   - Failed requests

3. **Error Rate**
   - HTTP 4xx errors
   - HTTP 5xx errors
   - Timeout errors

### Infrastructure Metrics

1. **Server Resources**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

2. **Database (Supabase)**
   - Query execution time
   - Connection pool usage
   - Active connections
   - Slow queries

3. **Cache (Redis)**
   - Hit rate
   - Miss rate
   - Memory usage
   - Eviction rate

4. **External APIs**
   - Gemini API response time
   - Zoo Dev API response time
   - API rate limits

---

## Load Testing Checklist

### Before Testing

- [ ] Deploy to staging environment
- [ ] Configure monitoring (logs, metrics)
- [ ] Set up test data
- [ ] Notify team about test schedule
- [ ] Backup database
- [ ] Document baseline performance
- [ ] Prepare test scenarios
- [ ] Set success criteria

### During Testing

- [ ] Monitor application logs
- [ ] Watch server resources
- [ ] Check database performance
- [ ] Monitor cache hit rates
- [ ] Track error rates
- [ ] Record response times
- [ ] Note any anomalies

### After Testing

- [ ] Analyze results
- [ ] Compare to baseline
- [ ] Identify bottlenecks
- [ ] Document findings
- [ ] Create optimization plan
- [ ] Share report with team
- [ ] Plan next test iteration

---

## Expected Results (Baseline)

### Good Performance Indicators

| Metric | Target | Excellent | Good | Needs Work |
|--------|--------|-----------|------|------------|
| Product List (cached) | < 200ms | < 100ms | < 300ms | > 500ms |
| Product Detail | < 300ms | < 200ms | < 500ms | > 1s |
| CAD Analysis | < 30s | < 15s | < 45s | > 60s |
| CAD Generation | < 5min | < 3min | < 7min | > 10min |
| Error Rate | < 1% | < 0.1% | < 2% | > 5% |
| Cache Hit Rate | > 80% | > 90% | > 70% | < 50% |

---

## Common Bottlenecks & Solutions

### 1. Slow Database Queries

**Symptoms:**
- High response times
- Database CPU at 100%
- Slow query logs

**Solutions:**
- Add database indexes
- Optimize queries
- Implement query caching
- Use connection pooling

### 2. Cache Misses

**Symptoms:**
- Inconsistent response times
- Low cache hit rate
- High database load

**Solutions:**
- Increase cache TTL
- Pre-warm cache
- Implement cache warming strategy
- Review cache key generation

### 3. External API Limits

**Symptoms:**
- 429 (Rate Limit) errors
- Slow CAD operations
- API timeout errors

**Solutions:**
- Implement request queuing
- Add retry logic with backoff
- Cache API responses
- Consider API tier upgrade

### 4. Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Server crashes after hours
- Slow performance degradation

**Solutions:**
- Profile memory usage
- Fix memory leaks in code
- Implement proper cleanup
- Restart workers periodically

### 5. Connection Pool Exhaustion

**Symptoms:**
- "Too many connections" errors
- Requests timing out
- Database connection errors

**Solutions:**
- Increase pool size
- Implement connection timeout
- Close connections properly
- Use connection pooling

---

## Reporting Template

### Load Test Report

**Test Date:** [Date]  
**Test Duration:** [Duration]  
**Test Tool:** [k6/JMeter/etc.]  
**Environment:** [Staging/Production]

#### Test Configuration
- **Concurrent Users:** [Number]
- **Ramp-up Time:** [Duration]
- **Test Duration:** [Duration]
- **Endpoints Tested:** [List]

#### Results Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Avg Response Time | < 500ms | [X]ms | ✅/❌ |
| p95 Response Time | < 1s | [X]ms | ✅/❌ |
| Error Rate | < 1% | [X]% | ✅/❌ |
| Throughput | > 100 RPS | [X] RPS | ✅/❌ |

#### Bottlenecks Identified
1. [Description]
2. [Description]

#### Recommendations
1. [Action item]
2. [Action item]

#### Next Steps
- [ ] [Action]
- [ ] [Action]

---

## Best Practices

### Do's ✅

1. **Start small** - Begin with smoke tests
2. **Test in staging** - Never load test production
3. **Monitor everything** - Logs, metrics, resources
4. **Use realistic data** - Match production data patterns
5. **Simulate real users** - Include think time
6. **Test incrementally** - Gradually increase load
7. **Document results** - Keep historical data
8. **Test regularly** - Make it part of CI/CD

### Don'ts ❌

1. **Don't test production** - Use staging/test environment
2. **Don't ignore warnings** - Small issues become big under load
3. **Don't test once** - Regular testing catches regressions
4. **Don't skip monitoring** - You need data to optimize
5. **Don't test without goals** - Define success criteria
6. **Don't forget cleanup** - Clean up test data
7. **Don't test alone** - Involve the team
8. **Don't ignore results** - Act on findings

---

## Tools Comparison

| Tool | Ease of Use | Features | Cost | Best For |
|------|-------------|----------|------|----------|
| **k6** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free | Modern APIs |
| **JMeter** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Free | Enterprise |
| **Artillery** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Free | CI/CD |
| **Locust** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free | Python devs |
| **Gatling** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Free/Paid | Large scale |

---

## Recommended Approach for SteelSmart

### Week 1: Setup & Baseline
1. Install k6
2. Create basic test scripts
3. Run smoke tests
4. Document baseline performance

### Week 2: Load Testing
1. Test product endpoints
2. Test CAD analysis (with small files)
3. Test authentication flows
4. Analyze results

### Week 3: Optimization
1. Identify bottlenecks
2. Implement fixes
3. Re-test to verify improvements
4. Document changes

### Week 4: Stress & Endurance
1. Find breaking point
2. Test long-running stability
3. Create final report
4. Plan ongoing testing

---

## Conclusion

Load testing is essential for ensuring your SteelSmart application can handle real-world traffic. Start with simple tests, gradually increase complexity, and always test in a safe environment.

**Key Takeaways:**
- Use k6 for modern, developer-friendly load testing
- Test incrementally (smoke → load → stress → endurance)
- Monitor everything during tests
- Act on findings and re-test
- Make load testing part of your regular workflow

**Next Steps:**
1. Choose a load testing tool (recommend k6)
2. Set up staging environment
3. Create test scripts for critical endpoints
4. Run baseline tests
5. Document and share results

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Status:** Ready for Implementation
