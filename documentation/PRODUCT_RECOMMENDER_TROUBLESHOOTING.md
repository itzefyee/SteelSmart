# Product Recommender Troubleshooting

## Issue: Infinite Loading

### Fixes Applied

#### 1. useEffect Dependency Fix
**Problem**: useEffect was calling `handleFindRecommendations` which could cause re-renders
**Solution**: 
- Added proper cleanup with `isMounted` flag
- Made the effect async with proper error handling
- Added empty dependency array to run only once
- Clean up URL and sessionStorage after use

#### 2. Error Handling
**Problem**: If any API call failed, loading state could get stuck
**Solution**:
- Wrapped each step in try-catch
- Always call `setIsLoading(false)` in finally block
- Reset states to empty arrays on error
- Added detailed console logging

#### 3. Timeout Protection
**Problem**: Supabase query could hang indefinitely
**Solution**:
- Added 10-second timeout to catalog search
- Uses `Promise.race()` to enforce timeout
- Returns empty array on timeout

#### 4. Debug Information
**Problem**: Hard to diagnose where it's getting stuck
**Solution**:
- Added debug state and UI display
- Console logging at each step
- Shows current operation status

## Debugging Steps

### Step 1: Check Browser Console
Open DevTools (F12) and look for:

```
🔍 Starting recommendations search...
📋 Search specs: { material: "...", ... }
🏪 Searching catalog...
✅ Catalog results: X
🤖 Getting AI alternatives...
✅ AI alternatives: Y
⭐ Ranking results...
✅ Ranked: Z
✅ Search complete
```

### Step 2: Check Debug Banner
Yellow banner at top shows current operation:
- "Starting search..."
- "Searching catalog..."
- "Found X catalog matches"
- "Getting AI alternatives..."
- "Found Y AI alternatives"
- "Ranking results..."
- "Complete! Z total recommendations"

### Step 3: Common Issues

#### Issue: Stuck on "Searching catalog..."
**Cause**: Supabase connection issue or empty table
**Check**:
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM products;
```
**Solution**:
- Verify products table has data
- Check RLS policies allow read access
- Verify environment variables are set

#### Issue: Stuck on "Getting AI alternatives..."
**Cause**: API endpoint error or timeout
**Check**:
- Navigate to `/api/recommendations/alternatives` directly
- Check API logs in Supabase
- Verify Gemini API key is set

**Solution**:
```bash
# Check .env.local
GEMINI_API_KEY=your-key-here
```

#### Issue: Error in console
**Cause**: Various - check error message
**Solutions**:
- "Catalog search timeout" → Database too slow or down
- "Alternative suggestions error" → API issue
- "Ranking error" → Logic error (report as bug)

### Step 4: Test Manually

#### Test Catalog Search Only
```typescript
// In browser console
const supabase = getSupabaseClient();
const { data, error } = await supabase.from('products').select('*').limit(5);
console.log('Products:', data, 'Error:', error);
```

#### Test API Endpoint
```bash
# Using curl or Postman
POST http://localhost:3000/api/recommendations/alternatives
Content-Type: application/json

{
  "specifications": {
    "material": "Steel",
    "category": "structural"
  }
}
```

## Quick Fixes

### Fix 1: Clear Browser Cache
```javascript
// In browser console
sessionStorage.clear();
localStorage.clear();
location.reload();
```

### Fix 2: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Fix 3: Check Environment Variables
```bash
# In .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

### Fix 4: Verify Database
```sql
-- Check products exist
SELECT * FROM products LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Temporarily disable RLS for testing
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

## Code Changes Made

### 1. ProductRecommenderNew.tsx

#### Added Cleanup
```typescript
useEffect(() => {
  let isMounted = true;
  
  const loadAnalysisData = async () => {
    // ... load data
    if (isMounted) {
      // ... set state
    }
  };
  
  loadAnalysisData();
  
  return () => {
    isMounted = false; // Cleanup
  };
}, []); // Empty deps - run once
```

#### Added Timeout
```typescript
const searchCatalog = async (specs: any) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), 10000);
  });
  
  const result = await Promise.race([query, timeoutPromise]);
  // ...
};
```

#### Added Error Handling
```typescript
try {
  // Step 1
  try {
    const results = await searchCatalog();
    setCatalogMatches(results);
  } catch (error) {
    console.error(error);
    setCatalogMatches([]); // Reset on error
  }
  
  // Step 2, 3...
} finally {
  setIsLoading(false); // Always stop loading
}
```

## Prevention

### Best Practices
1. **Always use finally**: Ensure loading states are reset
2. **Add timeouts**: Prevent hanging on slow APIs
3. **Error boundaries**: Catch and display errors gracefully
4. **Debug logging**: Make it easy to diagnose issues
5. **Empty states**: Show helpful messages when no data

### Testing Checklist
- [ ] Works with empty database
- [ ] Works with API errors
- [ ] Works with slow connections
- [ ] Works with invalid data
- [ ] Handles timeouts gracefully
- [ ] Shows appropriate error messages
- [ ] Loading state always resolves

## Monitoring

### Add to Production
```typescript
// Track loading times
const startTime = Date.now();
await handleFindRecommendations();
const duration = Date.now() - startTime;
console.log(`Search took ${duration}ms`);

// Alert if too slow
if (duration > 10000) {
  // Send to monitoring service
  console.warn('Slow search detected');
}
```

### Metrics to Track
- Average search time
- Timeout frequency
- Error rates
- Empty result frequency
- User abandonment rate

## Support

If issue persists:
1. Check all console logs
2. Verify database has data
3. Test API endpoints directly
4. Check environment variables
5. Review Supabase logs
6. Contact support with logs

## Debug Mode

To enable verbose logging:
```typescript
// Add to component
const DEBUG = true;

if (DEBUG) {
  console.log('State:', {
    isLoading,
    catalogMatches: catalogMatches.length,
    alternatives: alternatives.length,
    ranked: rankedRecommendations.length
  });
}
```

## Rollback

If new version has issues, revert to old:
```typescript
// In src/app/product-recommender/page.tsx
import ProductRecommender from '@/components/products/ProductRecommender';
// Instead of:
// import ProductRecommenderNew from '@/components/products/ProductRecommenderNew';
```

Old version uses hardcoded data but always works.
