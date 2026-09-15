# State Management & Caching Architecture Diagram

**Date**: December 15, 2025

## 🏗️ Three-Tier Caching Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    React Components                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │ RFQTracking  │  │ ProductCard  │  │ CADAnalyzer  │         │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │    │
│  │         │                  │                  │                  │    │
│  │         └──────────────────┴──────────────────┘                  │    │
│  │                            │                                     │    │
│  └────────────────────────────┼─────────────────────────────────────┘    │
│                               │                                          │
│  ┌────────────────────────────▼─────────────────────────────────────┐    │
│  │              LAYER 1: React Query (Client Cache)                 │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │  Query Cache (In-Memory)                                  │   │    │
│  │  │  • ['products', filters] → Product[]                      │   │    │
│  │  │  • ['rfqs'] → RFQ[]                                       │   │    │
│  │  │  • ['recommendations', specs] → Recommendation[]          │   │    │
│  │  │  • ['cad-history'] → CADHistory[]                         │   │    │
│  │  │                                                            │   │    │
│  │  │  TTL: 5-10 minutes                                        │   │    │
│  │  │  Automatic refetching on stale                            │   │    │
│  │  │  Background updates                                       │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              LAYER 2: Zustand (Client State)                   │    │
│  │  ┌──────────────────────────────────────────────────────────┐ │    │
│  │  │  Persisted State (localStorage)                           │ │    │
│  │  │  • CAD Store: format, units, recent prompts              │ │    │
│  │  │  • UI Store: theme, sidebar, view preferences            │ │    │
│  │  │  • Search Store: recent searches, filters                │ │    │
│  │  │  • RFQ Store: form drafts, current step                  │ │    │
│  │  │                                                            │ │    │
│  │  │  Persistence: Permanent (until cleared)                   │ │    │
│  │  │  Sync across tabs                                         │ │    │
│  │  └──────────────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ HTTP Requests
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                         SERVER (Next.js)                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    API Routes (Controllers)                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │ /api/rfqs    │  │ /api/products│  │ /api/cad     │         │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │    │
│  │         │                  │                  │                  │    │
│  │         └──────────────────┴──────────────────┘                  │    │
│  │                            │                                     │    │
│  └────────────────────────────┼─────────────────────────────────────┘    │
│                               │                                          │
│  ┌────────────────────────────▼─────────────────────────────────────┐    │
│  │                    Service Layer                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │ RFQService   │  │ProductService│  │ CADService   │         │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │    │
│  │         │                  │                  │                  │    │
│  │         └──────────────────┴──────────────────┘                  │    │
│  │                            │                                     │    │
│  └────────────────────────────┼─────────────────────────────────────┘    │
│                               │                                          │
│  ┌────────────────────────────▼─────────────────────────────────────┐    │
│  │              LAYER 3: Redis (Server Cache)                       │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │  Upstash Redis (Remote)                                   │   │    │
│  │  │  • products:all → Product[]                               │   │    │
│  │  │  • rfq:list:${userId} → RFQ[]                             │   │    │
│  │  │  • recommendations:${specs} → Recommendation[]            │   │    │
│  │  │  • cad-analysis:${hash} → Analysis                        │   │    │
│  │  │                                                            │   │    │
│  │  │  TTL: 5 minutes - 1 hour (configurable)                  │   │    │
│  │  │  Shared across all server instances                       │   │    │
│  │  │  Pattern-based invalidation                               │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Repository Layer                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │RFQRepository │  │ProductRepo   │  │ CADRepo      │         │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │    │
│  │         │                  │                  │                  │    │
│  │         └──────────────────┴──────────────────┘                  │    │
│  │                            │                                     │    │
│  └────────────────────────────┼─────────────────────────────────────┘    │
│                               │                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ SQL Queries
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                      DATABASE (Supabase PostgreSQL)                      │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Tables: products, rfqs, cad_history, profiles, etc.           │    │
│  │  Row Level Security (RLS) enabled                               │    │
│  │  User-scoped access                                             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Example: Fetching Products

### First Request (Cache Miss)

```
1. User visits catalog page
   │
   ├─> Component calls useProducts() hook
   │
   ├─> React Query checks cache
   │   └─> MISS (no cached data)
   │
   ├─> React Query calls ProductAPI.getProducts()
   │   └─> HTTP GET /api/products
   │
   ├─> Controller receives request
   │   └─> Calls ProductService.getProducts()
   │
   ├─> Service checks Redis cache
   │   └─> MISS (no cached data)
   │
   ├─> Service calls ProductRepository.findAll()
   │   └─> SQL query to Supabase
   │
   ├─> Repository returns Product[]
   │
   ├─> Service caches in Redis (TTL: 5 min)
   │   └─> Key: "products:all"
   │
   ├─> Controller returns JSON response
   │
   ├─> React Query caches response (staleTime: 5 min)
   │   └─> Key: ['products', filters]
   │
   └─> Component renders products
   
   Total Time: ~500ms
   Database Queries: 1
   API Calls: 1
```

### Second Request (Cache Hit)

```
1. User navigates back to catalog
   │
   ├─> Component calls useProducts() hook
   │
   ├─> React Query checks cache
   │   └─> HIT! (data is fresh)
   │
   └─> Component renders products immediately
   
   Total Time: ~5ms
   Database Queries: 0
   API Calls: 0
```

### Third Request (Stale but Cached)

```
1. User visits catalog after 6 minutes
   │
   ├─> Component calls useProducts() hook
   │
   ├─> React Query checks cache
   │   └─> HIT (data is stale but available)
   │
   ├─> Component renders cached products immediately
   │
   ├─> React Query refetches in background
   │   └─> HTTP GET /api/products
   │
   ├─> Service checks Redis cache
   │   └─> HIT! (Redis TTL not expired yet)
   │
   ├─> Service returns cached data
   │
   ├─> React Query updates cache
   │
   └─> Component re-renders with fresh data
   
   Initial Render: ~5ms (cached)
   Background Refetch: ~150ms (Redis hit)
   Database Queries: 0
   API Calls: 1
```

---

## 🔄 Data Flow Example: Submitting RFQ

### With Optimistic Updates

```
1. User submits RFQ form
   │
   ├─> Component calls submitRFQ() mutation
   │
   ├─> React Query onMutate (OPTIMISTIC UPDATE)
   │   ├─> Cancel ongoing queries
   │   ├─> Snapshot current cache
   │   ├─> Add new RFQ to cache immediately
   │   └─> Component re-renders with new RFQ
   │
   │   User sees instant feedback! ✨
   │
   ├─> React Query calls RFQAPI.submit()
   │   └─> HTTP POST /api/submit-rfq
   │
   ├─> Controller receives request
   │   └─> Calls RFQService.submitRFQ()
   │
   ├─> Service calls RFQRepository.create()
   │   └─> SQL INSERT to Supabase
   │
   ├─> Service invalidates Redis cache
   │   └─> DELETE "rfq:list:${userId}"
   │
   ├─> Controller returns created RFQ
   │
   ├─> React Query onSuccess
   │   ├─> Update cache with server response
   │   └─> Invalidate ['rfqs'] query
   │
   └─> Component shows success message
   
   Perceived Time: ~50ms (optimistic)
   Actual Time: ~300ms (server)
   Database Queries: 1
   API Calls: 1
```

### Error Handling with Rollback

```
1. User submits RFQ form
   │
   ├─> Optimistic update (instant feedback)
   │
   ├─> API call fails (network error)
   │
   ├─> React Query onError
   │   ├─> Restore snapshot from onMutate
   │   └─> Remove optimistic RFQ from cache
   │
   └─> Component shows error message
       User sees original state restored
```

---

## 🎯 Cache Invalidation Strategies

### Strategy 1: Time-Based (TTL)

```
┌─────────────────────────────────────────────────────────┐
│  Cache Entry                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Key: "products:all"                              │   │
│  │ Value: [Product1, Product2, ...]                │   │
│  │ TTL: 300 seconds (5 minutes)                     │   │
│  │ Created: 2025-12-15 10:00:00                     │   │
│  │ Expires: 2025-12-15 10:05:00                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Timeline:                                               │
│  10:00 ─────────────────────────────────────── 10:05    │
│  │                                              │        │
│  Created                                     Expires     │
│  (Fresh)                                     (Deleted)   │
└─────────────────────────────────────────────────────────┘
```

**Use Cases**:
- Product lists (5 min)
- RFQ lists (2 min)
- Recommendations (10 min)
- AI alternatives (1 hour)

---

### Strategy 2: Event-Based (Invalidation)

```
┌─────────────────────────────────────────────────────────┐
│  User Action: Update Product                            │
│                                                          │
│  1. Mutation executes                                    │
│     └─> Database updated                                │
│                                                          │
│  2. Service invalidates caches                           │
│     ├─> DELETE "products:all"                           │
│     ├─> DELETE "product:${id}"                          │
│     └─> DELETE "recommendations:*"                      │
│                                                          │
│  3. React Query invalidates queries                      │
│     ├─> Invalidate ['products']                         │
│     ├─> Invalidate ['product', id]                      │
│     └─> Invalidate ['recommendations']                  │
│                                                          │
│  4. Next request fetches fresh data                      │
│     └─> Rebuilds cache with new data                    │
└─────────────────────────────────────────────────────────┘
```

**Use Cases**:
- After product CRUD operations
- After RFQ submission
- After profile updates
- After CAD generation

---

### Strategy 3: Pattern-Based (Bulk Invalidation)

```
┌─────────────────────────────────────────────────────────┐
│  Invalidate all recommendation caches                    │
│                                                          │
│  Pattern: "recommendations:*"                            │
│                                                          │
│  Matches:                                                │
│  ├─> "recommendations:catalog:..."                      │
│  ├─> "recommendations:alternatives:..."                 │
│  ├─> "recommendations:product:123"                      │
│  └─> "recommendations:product:456"                      │
│                                                          │
│  All deleted in single operation                         │
└─────────────────────────────────────────────────────────┘
```

**Use Cases**:
- After product catalog changes
- After algorithm updates
- During maintenance
- For testing

---

## 🔍 Cache Key Naming Convention

### Pattern

```
{domain}:{operation}:{identifier}:{filters}
```

### Examples

```typescript
// Products
"products:all"                           // All products
"products:category:structural"           // Products by category
"products:search:steel"                  // Search results
"product:123"                            // Single product

// RFQs
"rfq:list:user123"                       // User's RFQ list
"rfq:456"                                // Single RFQ

// Recommendations
"recommendations:catalog:{"material":"steel"}"     // Catalog matches
"recommendations:alternatives:{"dims":"100x50"}"   // AI alternatives
"recommendations:product:123"                      // Product recommendations

// CAD
"cad:history:user123"                    // User's CAD history
"cad:analysis:abc123hash"                // Analysis by file hash
"cad:sample-files"                       // Sample files (static)

// User
"user:profile:user123"                   // User profile
"user:preferences:user123"               // User preferences
```

---

## 📊 Performance Comparison

### Before Optimization

```
User Request → Component
                  ↓
              fetch() call
                  ↓
              API Route
                  ↓
              Service
                  ↓
              Repository
                  ↓
              Database Query
                  ↓
              Response (500ms)
                  ↓
              Component renders

Every request hits database
No caching
Manual loading states
No optimistic updates
```

### After Optimization

```
User Request → Component
                  ↓
              useQuery() hook
                  ↓
              React Query Cache (HIT!)
                  ↓
              Component renders (5ms)

OR (if cache miss):

User Request → Component
                  ↓
              useQuery() hook
                  ↓
              React Query Cache (MISS)
                  ↓
              API Route
                  ↓
              Service
                  ↓
              Redis Cache (HIT!)
                  ↓
              Response (150ms)
                  ↓
              Component renders

OR (if both miss):

User Request → Component
                  ↓
              useQuery() hook
                  ↓
              React Query Cache (MISS)
                  ↓
              API Route
                  ↓
              Service
                  ↓
              Redis Cache (MISS)
                  ↓
              Repository
                  ↓
              Database Query
                  ↓
              Response (300ms)
                  ↓
              Cached in Redis
                  ↓
              Cached in React Query
                  ↓
              Component renders

Next request: 5ms (React Query hit)
```

---

## 🎯 Cache Hit Rate Goals

### Target Metrics

```
┌─────────────────────────────────────────────────────────┐
│  Cache Layer Performance                                 │
│                                                          │
│  React Query (Client):                                   │
│  ├─> Hit Rate: 85-90%                                   │
│  ├─> Avg Response: 5-10ms                               │
│  └─> Stale Time: 5-10 minutes                           │
│                                                          │
│  Redis (Server):                                         │
│  ├─> Hit Rate: 75-80%                                   │
│  ├─> Avg Response: 50-150ms                             │
│  └─> TTL: 2 minutes - 1 hour                            │
│                                                          │
│  Database (Fallback):                                    │
│  ├─> Hit Rate: 10-15%                                   │
│  ├─> Avg Response: 200-500ms                            │
│  └─> Only on cache misses                               │
│                                                          │
│  Overall Performance:                                    │
│  ├─> Avg Response: 50-100ms                             │
│  ├─> 95th Percentile: 200ms                             │
│  └─> 99th Percentile: 500ms                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 References

- **Analysis**: `STATE_MANAGEMENT_EXPANSION_ANALYSIS.md`
- **Roadmap**: `IMPLEMENTATION_ROADMAP.md`
- **Summary**: `EXPANSION_SUMMARY.md`

---

**This diagram provides a visual understanding of the three-tier caching architecture and data flow patterns.**
