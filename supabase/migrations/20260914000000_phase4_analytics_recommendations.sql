-- Phase 4: Postgres-first analytics and recommendation support.
-- This migration is intentionally additive/idempotent so deployments can roll
-- forward without replacing interaction history created by earlier migrations.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Keep the matching tables usable on databases that predate the original
-- product-matching migration, without changing any existing rows or columns.
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_products_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.material, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_search_vector_trigger ON products;
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_products_search_vector();

UPDATE products
SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(material, '')), 'C')
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);

CREATE TABLE IF NOT EXISTS product_embeddings (
  product_id VARCHAR(50) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  embedding vector(768),
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_product_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'click', 'search', 'rfq', 'purchase', 'add_to_cart')),
  search_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product ON user_product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON user_product_interactions(action);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON user_product_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON user_product_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_search_context ON user_product_interactions USING GIN(search_context);

ALTER TABLE user_product_interactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_product_interactions'
      AND policyname = 'Users can view own interactions'
  ) THEN
    CREATE POLICY "Users can view own interactions"
      ON user_product_interactions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_product_interactions'
      AND policyname = 'Users can insert own interactions'
  ) THEN
    CREATE POLICY "Users can insert own interactions"
      ON user_product_interactions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;

-- The RPCs deliberately expose aggregate product-level recommendations only;
-- they never return user, session, or search-context data.
CREATE OR REPLACE FUNCTION get_frequently_bought_together(
  p_product_id VARCHAR(255),
  p_limit INT DEFAULT 4
)
RETURNS TABLE (
  product_id VARCHAR(255),
  co_occurrence_count BIGINT,
  interaction_types TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i2.product_id,
    COUNT(*)::BIGINT AS co_occurrence_count,
    ARRAY_AGG(DISTINCT i2.action ORDER BY i2.action)::TEXT[] AS interaction_types
  FROM user_product_interactions i1
  JOIN user_product_interactions i2
    ON (i1.user_id IS NOT NULL AND i1.user_id = i2.user_id)
      OR (i1.session_id IS NOT NULL AND i1.session_id = i2.session_id)
  WHERE i1.product_id = p_product_id
    AND i2.product_id <> p_product_id
    AND i2.created_at >= i1.created_at - INTERVAL '30 days'
    AND i1.action IN ('view', 'click', 'rfq', 'purchase')
    AND i2.action IN ('view', 'click', 'rfq', 'purchase')
  GROUP BY i2.product_id
  ORDER BY co_occurrence_count DESC, i2.product_id
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 4), 50));
$$;

CREATE OR REPLACE FUNCTION get_similar_search_recommendations(
  p_material TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  product_id VARCHAR(255),
  interaction_count BIGINT,
  avg_confidence DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.product_id,
    COUNT(*)::BIGINT AS interaction_count,
    AVG(CASE
      WHEN i.action = 'purchase' THEN 1.0
      WHEN i.action = 'rfq' THEN 0.8
      WHEN i.action = 'click' THEN 0.6
      ELSE 0.4
    END)::DOUBLE PRECISION AS avg_confidence
  FROM user_product_interactions i
  WHERE (p_material IS NULL OR i.search_context->>'material' ILIKE '%' || p_material || '%')
    AND (p_category IS NULL OR i.search_context->>'category' = p_category)
    AND i.action IN ('click', 'rfq', 'purchase')
    AND i.created_at >= NOW() - INTERVAL '90 days'
  GROUP BY i.product_id
  ORDER BY interaction_count DESC, avg_confidence DESC, i.product_id
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 5), 50));
$$;

CREATE OR REPLACE FUNCTION match_product_embeddings(
  query_embedding vector(768),
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  product_id VARCHAR(50),
  similarity DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pe.product_id,
    (1 - (pe.embedding <=> query_embedding))::DOUBLE PRECISION AS similarity
  FROM product_embeddings pe
  WHERE pe.embedding IS NOT NULL
  ORDER BY pe.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(COALESCE(match_count, 8), 50));
$$;

GRANT EXECUTE ON FUNCTION get_frequently_bought_together(VARCHAR, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_similar_search_recommendations(TEXT, TEXT, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_product_embeddings(vector, INT) TO anon, authenticated, service_role;

-- Compact database-side aggregates avoid loading report tables just to count.
CREATE OR REPLACE FUNCTION get_admin_report_statistics()
RETURNS TABLE (status TEXT, report_count BIGINT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT status::TEXT, COUNT(*)::BIGINT
  FROM admin_reports
  GROUP BY status;
$$;

CREATE OR REPLACE FUNCTION get_product_inventory_statistics()
RETURNS TABLE (total BIGINT, in_stock BIGINT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT AS total,
    COUNT(*) FILTER (WHERE in_stock IS DISTINCT FROM FALSE)::BIGINT AS in_stock
  FROM products;
$$;

CREATE OR REPLACE FUNCTION get_audit_report_statistics(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH filtered AS MATERIALIZED (
    SELECT user_id, action, module, status, created_at
    FROM audit_logs
    WHERE created_at >= p_start AND created_at < p_end
  ),
  action_counts AS (
    SELECT action, COUNT(*)::BIGINT AS count,
      COUNT(*) FILTER (WHERE status = 'SUCCESS')::BIGINT AS success_count,
      COUNT(*) FILTER (WHERE status = 'FAILED')::BIGINT AS failed_count
    FROM filtered GROUP BY action
  ),
  module_counts AS (
    SELECT module, COUNT(*)::BIGINT AS count,
      COUNT(*) FILTER (WHERE status = 'SUCCESS')::BIGINT AS success_count,
      COUNT(*) FILTER (WHERE status = 'FAILED')::BIGINT AS failed_count
    FROM filtered GROUP BY module
  ),
  user_counts AS (
    SELECT user_id, COUNT(*)::BIGINT AS count,
      COUNT(*) FILTER (WHERE status = 'SUCCESS')::BIGINT AS success_count,
      COUNT(*) FILTER (WHERE status = 'FAILED')::BIGINT AS failed_count
    FROM filtered GROUP BY user_id
  ),
  daily_counts AS (
    SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
      COUNT(*)::BIGINT AS count
    FROM filtered GROUP BY date
  )
  SELECT jsonb_build_object(
    'totalLogs', (SELECT COUNT(*) FROM filtered),
    'successfulActions', (SELECT COUNT(*) FROM filtered WHERE status = 'SUCCESS'),
    'failedActions', (SELECT COUNT(*) FROM filtered WHERE status = 'FAILED'),
    'actionBreakdown', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'action', action, 'count', count, 'successCount', success_count, 'failedCount', failed_count
    ) ORDER BY count DESC, action) FROM action_counts), '[]'::jsonb),
    'moduleBreakdown', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'module', module, 'count', count, 'successCount', success_count, 'failedCount', failed_count
    ) ORDER BY count DESC, module) FROM module_counts), '[]'::jsonb),
    'userActivity', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'user_id', user_id, 'user_email', 'Admin User', 'totalActions', count,
      'successfulActions', success_count, 'failedActions', failed_count
    ) ORDER BY count DESC, user_id) FROM user_counts), '[]'::jsonb),
    'dailyActivity', COALESCE((SELECT jsonb_agg(jsonb_build_object('date', date, 'count', count) ORDER BY date)
      FROM daily_counts), '[]'::jsonb),
    'topActions', COALESCE((SELECT jsonb_agg(jsonb_build_object('action', action, 'count', count)
      ORDER BY count DESC, action) FROM (SELECT action, count FROM action_counts ORDER BY count DESC, action LIMIT 10) top), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION get_rfq_report_statistics(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH filtered AS MATERIALIZED (
    SELECT material, status
    FROM rfq_submissions
    WHERE created_at >= p_start AND created_at < p_end
  ),
  material_counts AS (
    SELECT material, COUNT(*)::BIGINT AS count
    FROM filtered
    WHERE material IS NOT NULL AND material <> ''
    GROUP BY material
  )
  SELECT jsonb_build_object(
    'totalInquiries', (SELECT COUNT(*) FROM filtered),
    'actionRequired', (SELECT COUNT(*) FROM filtered WHERE status = 'pending'),
    'quotedCount', (SELECT COUNT(*) FROM filtered WHERE status = 'quoted'),
    'topMaterial', COALESCE((SELECT material FROM material_counts ORDER BY count DESC, material LIMIT 1), 'N/A'),
    'materialBreakdown', COALESCE((SELECT jsonb_agg(jsonb_build_object('material', material, 'count', count)
      ORDER BY count DESC, material) FROM material_counts), '[]'::jsonb)
  );
$$;
