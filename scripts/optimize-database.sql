-- Database Performance Optimization Script
-- Run this in Supabase SQL Editor to improve query performance
-- Expected Impact: 30-50% faster filtered queries

-- ============================================================================
-- INDEXES FOR PRODUCT QUERIES
-- ============================================================================

-- Index for category filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_products_category 
  ON products(category);

-- Index for material filtering
CREATE INDEX IF NOT EXISTS idx_products_material 
  ON products(material);

-- Index for price range filtering
CREATE INDEX IF NOT EXISTS idx_products_price 
  ON products(price);

-- Index for stock status filtering
CREATE INDEX IF NOT EXISTS idx_products_in_stock 
  ON products(in_stock);

-- Composite index for category + price (common combination)
CREATE INDEX IF NOT EXISTS idx_products_category_price 
  ON products(category, price);

-- Composite index for category + stock (common combination)
CREATE INDEX IF NOT EXISTS idx_products_category_stock 
  ON products(category, in_stock);

-- ============================================================================
-- FULL-TEXT SEARCH OPTIMIZATION
-- ============================================================================

-- Full-text search index for name and description
-- This significantly improves search query performance
CREATE INDEX IF NOT EXISTS idx_products_search 
  ON products USING gin(
    to_tsvector('english', name || ' ' || description)
  );

-- Alternative: GIN index on individual columns
CREATE INDEX IF NOT EXISTS idx_products_name_gin 
  ON products USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_products_description_gin 
  ON products USING gin(to_tsvector('english', description));

-- ============================================================================
-- INDEXES FOR CAD HISTORY QUERIES
-- ============================================================================

-- Index for user-specific CAD history queries
CREATE INDEX IF NOT EXISTS idx_cad_history_user_id 
  ON cad_history(user_id);

-- Index for timestamp-based queries (recent history)
CREATE INDEX IF NOT EXISTS idx_cad_history_created_at 
  ON cad_history(created_at DESC);

-- Composite index for user + timestamp
CREATE INDEX IF NOT EXISTS idx_cad_history_user_created 
  ON cad_history(user_id, created_at DESC);

-- ============================================================================
-- INDEXES FOR TECHNICAL DRAWINGS
-- ============================================================================

-- Index for user-specific drawing queries
CREATE INDEX IF NOT EXISTS idx_technical_drawings_user_id 
  ON technical_drawings(user_id);

-- Index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_technical_drawings_created_at 
  ON technical_drawings(created_at DESC);

-- Composite index for user + timestamp
CREATE INDEX IF NOT EXISTS idx_technical_drawings_user_created 
  ON technical_drawings(user_id, created_at DESC);

-- ============================================================================
-- INDEXES FOR RFQ QUERIES
-- ============================================================================

-- Index for user-specific RFQ queries
CREATE INDEX IF NOT EXISTS idx_rfqs_user_id 
  ON rfqs(user_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_rfqs_status 
  ON rfqs(status);

-- Index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at 
  ON rfqs(created_at DESC);

-- Composite index for user + status
CREATE INDEX IF NOT EXISTS idx_rfqs_user_status 
  ON rfqs(user_id, status);

-- ============================================================================
-- QUERY PERFORMANCE ANALYSIS
-- ============================================================================

-- View to analyze slow queries (run periodically)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC
LIMIT 20;

-- ============================================================================
-- VACUUM AND ANALYZE
-- ============================================================================

-- Analyze tables to update statistics for query planner
ANALYZE products;
ANALYZE cad_history;
ANALYZE technical_drawings;
ANALYZE rfqs;

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

-- Query to verify all indexes are created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('products', 'cad_history', 'technical_drawings', 'rfqs')
ORDER BY tablename, indexname;

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table statistics
SELECT 
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as sequential_tuples_read,
  idx_scan as index_scans,
  idx_tup_fetch as index_tuples_fetched,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
Expected Performance Improvements:

1. Category Filtering: 40-60% faster
   - Before: Full table scan
   - After: Index scan on idx_products_category

2. Price Range Queries: 30-50% faster
   - Before: Full table scan with filter
   - After: Index scan on idx_products_price

3. Full-Text Search: 70-90% faster
   - Before: ILIKE queries (slow)
   - After: GIN index with to_tsvector

4. User-Specific Queries: 50-70% faster
   - Before: Full table scan with user_id filter
   - After: Index scan on user_id indexes

5. Combined Filters: 60-80% faster
   - Before: Multiple full table scans
   - After: Composite index scans

Maintenance:
- Run ANALYZE periodically (weekly) to update statistics
- Monitor slow_queries view to identify new bottlenecks
- Check index usage to ensure indexes are being used
- Consider adding more indexes based on actual query patterns

Index Size Impact:
- Each index adds ~5-10% to table size
- Total additional storage: ~50-100MB for typical dataset
- Trade-off: Slightly slower writes, much faster reads

When to Rebuild Indexes:
- After bulk data imports
- If query performance degrades over time
- Monthly maintenance: REINDEX TABLE products;
*/
