-- Phase 3: durable, server-only cache for supplier catalog discovery.
-- This migration is additive and can safely be retried. Existing catalog and
-- taxonomy data is deliberately left untouched.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS external_catalog_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  query JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  providers TEXT[] NOT NULL DEFAULT '{}'::text[],
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_catalog_cache_expires_at
  ON external_catalog_cache (expires_at);

-- Cache rows contain provider-derived product information and are read/written
-- only by the server's service-role client; never expose this table directly.
ALTER TABLE external_catalog_cache ENABLE ROW LEVEL SECURITY;
