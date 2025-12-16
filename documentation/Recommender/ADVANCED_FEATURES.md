# Advanced Recommender Features

**Date**: December 2024  
**Status**: Implemented  
**Features**: Collaborative Filtering, Interaction Tracking, Smart Fallbacks, Search Guidance

---

## 🎯 Overview

This document describes the advanced features implemented to improve product recommendations beyond basic rule-based matching.

---

## 🔄 Collaborative Filtering

### What It Does

Tracks user interactions to provide recommendations based on collective behavior:
- "Frequently bought together"
- "Users who viewed this also viewed..."
- Popular products in similar searches

### Database Schema

**Table**: `user_product_interactions`

```sql
CREATE TABLE user_product_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  action VARCHAR(50), -- 'view', 'click', 'search', 'rfq', 'purchase', 'add_to_cart'
  search_context JSONB,
  session_id VARCHAR(255),
  created_at TIMESTAMP
);
```

### Functions

**1. Get Frequently Bought Together**
```sql
SELECT * FROM get_frequently_bought_together('product-id', 4);
```

Returns products that users frequently interact with together.

**2. Get Similar Search Recommendations**
```sql
SELECT * FROM get_similar_search_recommendations('steel', 'structural', 5);
```

Returns products popular in similar searches.

### Usage in Code

```typescript
import { InteractionTrackingService } from '@/services/interaction-tracking.service';

// Get frequently bought together
const recommendations = await InteractionTrackingService.getFrequentlyBoughtTogether(
  productId,
  4
);

// Get similar search recommendations
const similarRecs = await InteractionTrackingService.getSimilarSearchRecommendations(
  { material: 'steel', category: 'structural' },
  5
);
```

---

## 📊 Interaction Tracking

### Tracked Actions

1. **view** - User views product detail page
2. **click** - User clicks product from search results
3. **search** - User searches for products
4. **rfq** - User submits RFQ for product
5. **purchase** - User purchases product
6. **add_to_cart** - User adds product to cart

### Client-Side Tracking

```typescript
import { useInteractionTracking } from '@/hooks/useInteractionTracking';

function ProductCard({ product, searchContext }) {
  const { trackClick, trackView } = useInteractionTracking();
  
  // Track view when component mounts
  useEffect(() => {
    trackView(product.id, searchContext);
  }, [product.id]);
  
  // Track click when user clicks
  const handleClick = () => {
    trackClick(product.id, searchContext);
    router.push(`/catalog/${product.id}`);
  };
  
  return <div onClick={handleClick}>...</div>;
}
```

### Server-Side Tracking

```typescript
import { InteractionTrackingService } from '@/services/interaction-tracking.service';

// In API route
await InteractionTrackingService.trackInteractionServer(
  userId,
  {
    productId: 'product-123',
    action: 'purchase',
    searchContext: { material: 'steel' },
  }
);
```

### API Endpoint

```bash
POST /api/interactions/track
{
  "productId": "product-123",
  "action": "view",
  "searchContext": {
    "material": "steel",
    "category": "structural"
  }
}
```

---

## 🎯 Smart Fallback System

### Fallback Strategies (in order)

When no good matches are found, the system tries:

1. **Collaborative Filtering** (Score: 0.65-0.60)
   - Products popular in similar searches
   - Based on user behavior patterns

2. **Category-Based** (Score: 0.45-0.40)
   - Products in same category
   - Prioritizes in-stock items

3. **Material-Based** (Score: 0.40-0.35)
   - Products with same material family
   - Good for material-specific searches

4. **Popular Products** (Score: 0.30-0.25)
   - Most popular in-stock products
   - Last resort fallback

### Implementation

```typescript
// In product-matcher.ts
private async getFallbackProducts(
  specs: NormalizedSpecs,
  client: SupabaseClient
): Promise<RecommendationScore[]> {
  // Try collaborative filtering first
  const collaborativeRecs = await InteractionTrackingService
    .getSimilarSearchRecommendations(...);
  
  // Fall back to category-based
  if (collaborativeRecs.length < 4) {
    // Add category matches
  }
  
  // Fall back to material-based
  if (still < 4) {
    // Add material matches
  }
  
  // Last resort: popular products
  if (still < 4) {
    // Add popular products
  }
}
```

---

## 💡 Search Guidance

### What It Does

Provides helpful suggestions when:
- No results found
- Very few results (< 3)
- Low confidence scores (< 0.7)

### Component Usage

```typescript
import { SearchGuidance } from '@/components/products/SearchGuidance';

function SearchResults({ results, searchSpecs }) {
  return (
    <>
      <SearchGuidance
        searchResults={results}
        searchSpecs={searchSpecs}
        onSuggestionClick={(newSpecs) => performSearch(newSpecs)}
      />
      
      {/* Results */}
    </>
  );
}
```

### Features

**1. Missing Field Suggestions**
- Suggests adding material if missing
- Suggests selecting category if missing
- Suggests adding dimensions if missing

**2. Quick Search Buttons**
- "All Steel products"
- "All Structural"
- "Without dimension filter"
- Popular materials

**3. Alternative Searches**
- Similar materials (e.g., "Stainless Steel" if searched "Steel")
- Related categories
- Relaxed dimensions (±10% tolerance)

---

## 🔧 Integration Guide

### Step 1: Set Up Database

Run the migration:
```bash
# In Supabase SQL Editor
-- Run: supabase/migrations/add_user_interactions_table.sql
```

### Step 2: Track Interactions

**In Product Detail Page:**
```typescript
'use client';

import { useInteractionTracking } from '@/hooks/useInteractionTracking';

export default function ProductDetailPage({ product }) {
  const { trackView } = useInteractionTracking();
  
  useEffect(() => {
    trackView(product.id);
  }, [product.id]);
  
  return <div>...</div>;
}
```

**In Search Results:**
```typescript
function ProductCard({ product, searchContext }) {
  const { trackClick } = useInteractionTracking();
  
  return (
    <Link
      href={`/catalog/${product.id}`}
      onClick={() => trackClick(product.id, searchContext)}
    >
      {product.name}
    </Link>
  );
}
```

**In RFQ Form:**
```typescript
function RFQForm({ productId }) {
  const { trackRFQ } = useInteractionTracking();
  
  const handleSubmit = async () => {
    await submitRFQ();
    trackRFQ(productId);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Step 3: Use Collaborative Recommendations

```typescript
import { RecommendationService } from '@/services/recommendation.service';

// Get recommendations with collaborative filtering
const recommendations = await RecommendationService.getRecommendationsWithProducts(
  productId,
  4,
  true // includeCollaborative
);
```

### Step 4: Add Search Guidance

```typescript
import { SearchGuidance } from '@/components/products/SearchGuidance';

function ProductRecommender() {
  const [results, setResults] = useState([]);
  const [searchSpecs, setSearchSpecs] = useState({});
  
  return (
    <>
      <SearchGuidance
        searchResults={results}
        searchSpecs={searchSpecs}
        onSuggestionClick={setSearchSpecs}
      />
      
      {/* Results */}
    </>
  );
}
```

---

## 📊 Analytics & Insights

### Track User Behavior

```typescript
// Get user's interaction history
const response = await fetch('/api/interactions/track?limit=20&action=view');
const { data } = await response.json();

// data contains:
// - product_id
// - action
// - search_context
// - created_at
```

### Popular Products

```sql
SELECT 
  product_id,
  COUNT(*) as view_count
FROM user_product_interactions
WHERE action = 'view'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY product_id
ORDER BY view_count DESC
LIMIT 10;
```

### Conversion Funnel

```sql
SELECT 
  action,
  COUNT(*) as count
FROM user_product_interactions
WHERE product_id = 'product-123'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY action
ORDER BY 
  CASE action
    WHEN 'view' THEN 1
    WHEN 'click' THEN 2
    WHEN 'search' THEN 3
    WHEN 'add_to_cart' THEN 4
    WHEN 'rfq' THEN 5
    WHEN 'purchase' THEN 6
  END;
```

---

## 🎯 Performance Considerations

### Caching

Collaborative filtering results are cached:
- **Frequently bought together**: 1 hour
- **Similar search recommendations**: 30 minutes

### Async Tracking

Interaction tracking is non-blocking:
```typescript
// Tracking happens asynchronously
trackView(productId); // Returns immediately
// User experience not affected
```

### Fallback Performance

Fallback strategies are tried in order of speed:
1. Collaborative (cached) - Fast
2. Category-based - Medium
3. Material-based - Medium
4. Popular products - Fast

---

## 🔒 Privacy & Security

### Row Level Security

Users can only:
- View their own interactions
- Insert their own interactions

Service role can:
- View all interactions (for analytics)
- Aggregate data (anonymized)

### Anonymous Tracking

Users without accounts are tracked via session ID:
```typescript
// Session ID stored in sessionStorage
const sessionId = sessionStorage.getItem('session_id');
```

### Data Retention

Consider implementing:
```sql
-- Delete old interactions (optional)
DELETE FROM user_product_interactions
WHERE created_at < NOW() - INTERVAL '1 year';
```

---

## 📈 Expected Impact

### Before Advanced Features
- Fallback quality: Low (generic products)
- Cold start problem: No recommendations for new products
- Search guidance: None

### After Advanced Features
- Fallback quality: High (behavior-based)
- Cold start: Mitigated by collaborative filtering
- Search guidance: Helpful suggestions
- User engagement: +30-40% expected
- Conversion rate: +15-20% expected

---

## 🐛 Troubleshooting

### Interactions Not Tracking

**Check**:
1. Database table exists
2. RLS policies are set up
3. User is authenticated (or session ID exists)
4. No console errors

**Debug**:
```typescript
// Enable debug logging
console.log('Tracking interaction:', { productId, action });
await InteractionTrackingService.trackInteractionClient(...);
console.log('Interaction tracked successfully');
```

### Collaborative Recommendations Empty

**Possible causes**:
1. Not enough interaction data yet
2. RPC functions not created
3. Cache expired

**Solution**:
```sql
-- Check if data exists
SELECT COUNT(*) FROM user_product_interactions;

-- Check if functions exist
SELECT * FROM pg_proc WHERE proname LIKE '%frequently%';
```

### Search Guidance Not Showing

**Check**:
1. Results have confidence scores
2. Component is imported correctly
3. Props are passed correctly

---

## 📚 Related Files

- `src/services/interaction-tracking.service.ts` - Core service
- `src/hooks/useInteractionTracking.ts` - React hook
- `src/components/products/SearchGuidance.tsx` - UI component
- `src/app/api/interactions/track/route.ts` - API endpoint
- `supabase/migrations/add_user_interactions_table.sql` - Database schema

---

## ✅ Summary

Advanced features implemented:
- ✅ Collaborative filtering
- ✅ Interaction tracking
- ✅ Smart fallback system
- ✅ Search guidance
- ✅ Analytics foundation

These features work together to provide better recommendations even with incomplete data, leveraging user behavior to improve match quality over time.
