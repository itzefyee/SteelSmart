# Quick Fix - Migration Error

## Error You're Seeing

```
ERROR: foreign key constraint cannot be implemented
DETAIL: Key columns "product_id" and "id" are of incompatible types: uuid and character varying.
```

## Quick Fix (3 Steps)

### 1. Verify Your Schema

```bash
npm run verify-schema
```

### 2. Run the V2 Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy **entire contents** of: `supabase/migrations/add_user_interactions_table_v2.sql`
3. Paste and click **Run**
4. Look for success messages

### 3. Verify It Worked

```sql
SELECT COUNT(*) FROM user_product_interactions;
```

Should return `0` (empty table, but exists).

---

## Why This Happened

Your `products` table uses `VARCHAR(255)` for IDs (like `"servo-motor-sm100"`), not UUIDs. The V2 migration handles this correctly.

---

## What's Different in V2?

- ✅ Drops existing table first (clean slate)
- ✅ Explicit foreign key creation
- ✅ Schema verification
- ✅ Better error messages

---

## Next Steps

After migration succeeds:

1. Continue with `IMPLEMENTATION_CHECKLIST.md`
2. Integrate tracking hooks
3. Test features

---

## Need More Help?

See `MIGRATION_FIX_GUIDE.md` for detailed troubleshooting.
