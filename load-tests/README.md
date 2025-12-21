# Load Testing Guide

This directory contains k6 load tests for the SteelSmart API.

## Prerequisites

Install k6:
- **Windows**: `choco install k6` or download from [k6.io](https://k6.io/docs/get-started/installation/)
- **macOS**: `brew install k6`
- **Linux**: `sudo apt-get install k6` or use snap

## Available Tests

### 1. Smoke Test (`load-products-smoke.js`)
**Purpose**: Basic functionality and performance validation  
**Load**: 10 concurrent users  
**Duration**: 3 minutes  
**Use Case**: Quick validation after deployments, CI/CD pipeline

```bash
k6 run load-products-smoke.js
```

**Expected Results**:
- 95th percentile < 1000ms
- Error rate < 2%
- Cache hit rate > 70%

---

### 2. Stress Test (`load-products-stress.js`)
**Purpose**: High-load performance testing  
**Load**: 100 concurrent users (peak)  
**Duration**: 14 minutes (5 minutes at peak)  
**Use Case**: Capacity planning, bottleneck identification

```bash
k6 run load-products-stress.js
```

**Load Profile**:
- 0-1 min: Ramp to 20 users
- 1-3 min: Ramp to 50 users
- 3-6 min: Ramp to 100 users
- 6-11 min: Hold at 100 users (stress period)
- 11-13 min: Ramp down to 50 users
- 13-14 min: Cool down to 0

**Expected Results**:
- 95th percentile < 2000ms
- Error rate < 5%
- Cache hit rate > 60%
- Total errors < 100

---Load Test Overview (load-products-smoke.js)
This is a k6 performance test that simulates realistic user behavior on the SteelSmart product API:

Test Configuration:

Duration: 3 minutes total (30s ramp-up, 2min steady, 30s ramp-down)
Concurrent Users: 10 virtual users
Target: http://localhost:3000 (configurable via BASE_URL env var)
What It Tests:

Product List API (100% of users)

Tests 4 scenarios randomly: default listing, category filter, price filter, search
Tracks cache hit rate (expects >70%)
Expects 95th percentile < 500ms
Product Details API (80% of users)

Randomly selects a product from the list
Views detailed product info
Expects 95th percentile < 600ms
Recommendations API (40% of users - 50% of detail viewers)

Gets product recommendations
Expects 95th percentile < 800ms
Performance Thresholds:

Overall 95th percentile < 1000ms
Error rate < 2%
Cache hit rate > 70% (validates Redis caching)
Endpoint-specific response time targets
Realistic Behavior:

Random scenario selection
Sleep/think times between requests (1-3 seconds)
Probabilistic user flows (not everyone views details/recommendations)
Custom Metrics:

Tracks cache effectiveness
Separate duration trends per endpoint
Validates pagination and data structure
This test validates that the 3-tier caching architecture (React Query + Zustand + Redis) is working effectively under load.

## Configuration

### Custom Base URL
```bash
BASE_URL=https://your-domain.com k6 run load-products-smoke.js
```

### Output Formats

**JSON Output**:
```bash
k6 run --out json=results.json load-products-smoke.js
```

**CSV Output**:
```bash
k6 run --out csv=results.csv load-products-smoke.js
```

**InfluxDB (for Grafana dashboards)**:
```bash
k6 run --out influxdb=http://localhost:8086/k6 load-products-smoke.js
```

---

## Test Scenarios

Both tests simulate realistic user behavior:

### Product Browsing (100% of users)
- Default product listing
- Category filtering
- Price range filtering
- Search queries

### Product Details (75-80% of users)
- View random product from list
- Read product specifications
- Check pricing and availability

### Recommendations (40-60% of detail viewers)
- Get product recommendations
- View compatible products
- Check alternatives

### Additional Scenarios (Stress Test Only)
- **Pagination**: 30% of users browse multiple pages
- **Category Browsing**: 20% of users explore different categories

---

## Metrics Tracked

### Standard k6 Metrics
- `http_req_duration`: Request duration (p95, p99)
- `http_req_failed`: Failed request rate
- `http_reqs`: Total requests per second
- `vus`: Virtual users (concurrent)

### Custom Metrics
- `cache_hit_rate`: Percentage of cached responses
- `product_list_duration`: Product list API performance
- `product_detail_duration`: Product detail API performance
- `recommendation_duration`: Recommendation API performance
- `error_count`: Total error count (stress test only)

---

## Interpreting Results

### Good Performance Indicators
✅ Cache hit rate > 70% (smoke) or > 60% (stress)  
✅ 95th percentile response times within thresholds  
✅ Error rate < 2% (smoke) or < 5% (stress)  
✅ Consistent performance throughout test duration

### Warning Signs
⚠️ Cache hit rate dropping below 50%  
⚠️ Response times increasing over time  
⚠️ Error rate > 5%  
⚠️ Memory/CPU usage continuously climbing

### Critical Issues
❌ Error rate > 10%  
❌ Response times > 5 seconds  
❌ Server crashes or restarts  
❌ Database connection pool exhaustion

---

## Troubleshooting

### High Response Times
1. Check Redis cache is running and connected
2. Verify database connection pool size
3. Monitor server CPU/memory usage
4. Check for slow database queries

### Low Cache Hit Rate
1. Verify Redis is running: `redis-cli ping`
2. Check cache TTL settings in service layer
3. Ensure cache keys are consistent
4. Monitor Redis memory usage

### High Error Rate
1. Check server logs for errors
2. Verify database connection limits
3. Check API rate limiting settings
4. Monitor network connectivity

### Database Issues
1. Check connection pool exhaustion
2. Monitor slow query log
3. Verify indexes on filtered columns
4. Check for table locks

---

## Best Practices

### Before Running Tests
1. ✅ Ensure dev server is running: `npm run dev`
2. ✅ Verify Redis is running: `redis-cli ping`
3. ✅ Check database is accessible
4. ✅ Clear Redis cache for baseline: `redis-cli FLUSHALL`
5. ✅ Monitor system resources (CPU, memory, disk)

### During Tests
1. 📊 Monitor server logs in real-time
2. 📊 Watch Redis memory usage
3. 📊 Track database connection count
4. 📊 Observe response time trends

### After Tests
1. 📈 Analyze k6 summary report
2. 📈 Review custom metrics
3. 📈 Check for error patterns
4. 📈 Compare against baseline results
5. 📈 Document findings and improvements

---

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Load Tests
  run: |
    npm run dev &
    sleep 10
    k6 run load-tests/load-products-smoke.js
    kill %1
```

### Performance Regression Detection
```bash
# Save baseline
k6 run --out json=baseline.json load-products-smoke.js

# Compare against baseline
k6 run --out json=current.json load-products-smoke.js
# Use k6-reporter or custom script to compare results
```

---

## Advanced Usage

### Custom Thresholds
```bash
k6 run \
  --threshold http_req_duration=p(95)<500 \
  --threshold http_req_failed=rate<0.01 \
  load-products-smoke.js
```

### Specific Stage Testing
```bash
# Quick 1-minute test with 50 users
k6 run --stage 1m:50 load-products-smoke.js
```

### Debug Mode
```bash
k6 run --http-debug load-products-smoke.js
```

---

## Performance Targets

### Smoke Test (10 users)
| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| P95 Response Time | < 500ms | < 1000ms | > 1500ms |
| P99 Response Time | < 800ms | < 1500ms | > 2000ms |
| Error Rate | < 1% | < 2% | > 5% |
| Cache Hit Rate | > 80% | > 70% | < 50% |

### Stress Test (100 users)
| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| P95 Response Time | < 1500ms | < 2000ms | > 3000ms |
| P99 Response Time | < 2000ms | < 3000ms | > 5000ms |
| Error Rate | < 3% | < 5% | > 10% |
| Cache Hit Rate | > 70% | > 60% | < 40% |

---

## Related Documentation

- [Performance Improvements](../documentation/Performance%20Bottlenecks/PERFORMANCE_IMPROVEMENTS_IMPLEMENTED.md)
- [Caching Strategy](../documentation/State%20Management%20&%20Caching/IMPLEMENTATION_ROADMAP.md)
- [Architecture Overview](../documentation/Architecture/ARCHITECTURE_ANALYSIS.md)
