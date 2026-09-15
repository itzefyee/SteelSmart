-- Keep the existing two-argument matcher for older deployments. The expanded
-- function lets the new client avoid comparing vectors from different models.
CREATE OR REPLACE FUNCTION match_product_embeddings(
  query_embedding vector(768),
  match_count INT,
  required_source TEXT
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
    AND pe.source = required_source
  ORDER BY pe.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(COALESCE(match_count, 8), 50));
$$;

GRANT EXECUTE ON FUNCTION match_product_embeddings(vector, INT, TEXT) TO anon, authenticated, service_role;
