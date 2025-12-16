# Migration Fix Guide - User Interactions Table

## The Problem

When running the `add_user_interactions_table.sql` migration, you may encounter this error:

```
ERROR: 42804: foreign key constraint "user_product_interactions_product_id_fkey" cannot be implemented
DETAIL: Key columns "product_id" and "id" are of incompatible types: uuid and character varying.
```

## Why This Happens

This error occurs because:
1. Your `products` table uses `VARCHAR(255)` for the `id` column
2. The migration initially tried to create a foreign key with mismatched types
3. Supabase's schema cache may have cached the wrong type

## The Solution

We've created **two fixed migration files** and a **verification script**.

---

## Step 1: Verify Your Schema (Recommended)

Before running any migration, verify your products table structure:

```bash
npm run verify-schema
```

This will:
- ✅ Check your products table structure
- ✅ Identify the ID column type (UUID vs VARCHAR)
- ✅ Check if user_product_interactions already exists
- ✅ Provide specific recommendations

### Expected Output:

```
🔍 Verifying Products Table Schema
=====================================

✓ Products table exists

📋 Sample Product:
{
  "id": "servo-motor-sm100",
  "name": "Servo Motor SM100",
  ...
}

🔑 ID Column Info:
  Type: string
  Value: servo-motor-sm100
  Length: 18
  Format: VARCHAR/String

✅ ID column appears to be VARCHAR - compatible with migration
```

---

## Step 2: Choose the Right Migration

### Option A: Use V2 Migration (RECOMMENDED)

**File**: `supabase/migrations/add_user_interactions_table_v2.sql`

**Why V2?**
- ✅ Includes schema verification
- ✅ Drops existing table if present (clean slate)
- ✅ Explicit foreign key creation
- ✅ Better error messages
- ✅ Success notifications

**How to use:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `add_user_interactions_table_v2.sql`
3. Paste and click "Run"
4. Look for success notices

### Option B: Use Original Migration (Fixed)

**File**: `supabase/migrations/add_user_interactions_table.sql`

**Why Original?**
- ✅ Simpler, more concise
- ✅ Also fixed for VARCHAR compatibility
- ✅ Works if you prefer minimal SQL

**How to use:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `add_user_interactions_table.sql`
3. Paste and click "Run"

---

## Step 3: Verify Migration Success

After running the migration, verify it worked:

### Check Table Exists

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'user_product_interactions';
```

Expected: 1 row returned

### Check Foreign Key

```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_product_interactions';
```

Expected: Should show `product_id` → `products(id)` relationship

### Check Functions Exist

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_frequently_bought_together',
  'get_similar_search_recommendations'
);
```

Expected: 2 rows returned

### Test Functions

```sql
-- Test frequently bought together (should return empty initially)
SELECT * FROM get_frequently_bought_together('servo-motor-sm100', 4);

-- Test similar search recommendations (should return empty initially)
SELECT * FROM get_similar_search_recommendations('steel', 'structural', 5);
```

---

## Troubleshooting

### Error: "relation already exists"

**Problem**: Table already exists from previous attempt

**Solution**: Use V2 migration (it drops the table first) OR manually drop:

```sql
DROP TABLE IF EXISTS user_product_interactions CASCADE;
```

Then run the migration again.

### Error: "function already exists"

**Problem**: Functions exist from previous attempt

**Solution**: Drop them first:

```sql
DROP FUNCTION IF EXISTS get_frequently_bought_together(VARCHAR, INT);
DROP FUNCTION IF EXISTS get_similar_search_recommendations(TEXT, TEXT, INT);
```

Then run the migration again.

### Error: "permission denied"

**Problem**: Not using service role key

**Solution**: Make sure you're logged into Supabase Dashboard with admin access.

### Error: Still getting UUID mismatch

**Problem**: Your products table actually uses UUID

**Solution**: 
1. Run `npm run verify-schema` to confirm
2. If products.id is UUID, modify the migration:
   - Change `product_id VARCHAR(255)` to `product_id UUID`
   - Update all function signatures to use UUID

---

## What Gets Created

### Table: `user_product_interactions`

Tracks user behavior for collaborative filtering:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users (nullable for anonymous) |
| product_id | VARCHAR(255) | Foreign key to products |
| action | VARCHAR(50) | Type: view, click, search, rfq, purchase, add_to_cart |
| search_context | JSONB | Search parameters when interaction occurred |
| session_id | VARCHAR(255) | For anonymous user tracking |
| created_at | TIMESTAMP | When interaction occurred |

### Function: `get_frequently_bought_together()`

Returns products frequently viewed/bought with a given product.

**Usage:**
```sql
SELECT * FROM get_frequently_bought_together('servo-motor-sm100', 4);
```

**Returns:**
- `product_id`: Related product ID
- `co_occurrence_count`: How many times viewed together
- `interaction_types`: Array of interaction types

### Function: `get_similar_search_recommendations()`

Returns products popular in similar searches.

**Usage:**
```sql
SELECT * FROM get_similar_search_recommendations('steel', 'structural', 5);
```

**Returns:**
- `product_id`: Recommended product ID
- `interaction_count`: Number of interactions
- `avg_confidence`: Confidence score (0-1)

### Row Level Security (RLS)

Three policies created:
1. **Users can view own interactions**: Users see only their data
2. **Users can insert own interactions**: Users can track their actions
3. **Service role has full access**: Backend can access all data

---

## Next Steps

After successful migration:

1. ✅ Verify migration success (see Step 3 above)
2. ✅ Continue with implementation checklist
3. ✅ Integrate tracking hooks in components
4. ✅ Test interaction tracking
5. ✅ Monitor collaborative recommendations

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/add_user_interactions_table_v2.sql` | Recommended migration with verification |
| `supabase/migrations/add_user_interactions_table.sql` | Original migration (fixed) |
| `scripts/verify-products-schema.ts` | Schema verification script |
| `IMPLEMENTATION_CHECKLIST.md` | Complete implementation guide |
| `documentation/Recommender/ADVANCED_FEATURES.md` | Feature documentation |

---

## Support

If you continue to have issues:

1. Run `npm run verify-schema` and share output
2. Check Supabase logs for detailed error messages
3. Verify you have admin access to Supabase
4. Ensure no other migrations are running

---

**Ready to proceed!** Start with Step 1 (verify schema) and work through the steps.
