-- Phase 8.1: shared/database-backed abuse protection.
--
-- 1) Better Auth rate-limit storage is persisted in public."rateLimit" because
--    Better Auth 1.4.19 expects that model when rateLimit.storage = "database".
--    Browser roles have no direct access.
-- 2) Public RSVP/wishes rate limits live in app_private and are consumed only
--    by server-side PostgreSQL access. They are not exposed through PostgREST.

BEGIN;

CREATE TABLE IF NOT EXISTS public."rateLimit" (
  id TEXT PRIMARY KEY NOT NULL,
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  "lastRequest" BIGINT NOT NULL
);

ALTER TABLE public."rateLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."rateLimit" FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS app_private.public_rate_limits (
  rate_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL CHECK (request_count >= 0),
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_rate_limits_reset_at
  ON app_private.public_rate_limits(reset_at);

REVOKE ALL ON TABLE app_private.public_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.consume_public_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, pg_temp
AS $$
DECLARE
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF p_key IS NULL OR btrim(p_key) = '' OR length(p_key) > 512 THEN
    RAISE EXCEPTION 'invalid rate limit key';
  END IF;
  IF p_limit < 1 OR p_limit > 100000 THEN
    RAISE EXCEPTION 'invalid rate limit maximum';
  END IF;
  IF p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid rate limit window';
  END IF;

  INSERT INTO app_private.public_rate_limits (
    rate_key,
    request_count,
    reset_at,
    updated_at
  ) VALUES (
    p_key,
    1,
    v_now + make_interval(secs => p_window_seconds),
    v_now
  )
  ON CONFLICT (rate_key) DO UPDATE
  SET
    request_count = CASE
      WHEN app_private.public_rate_limits.reset_at <= v_now THEN 1
      ELSE LEAST(app_private.public_rate_limits.request_count + 1, p_limit + 1)
    END,
    reset_at = CASE
      WHEN app_private.public_rate_limits.reset_at <= v_now
        THEN v_now + make_interval(secs => p_window_seconds)
      ELSE app_private.public_rate_limits.reset_at
    END,
    updated_at = v_now
  RETURNING request_count, reset_at INTO v_count, v_reset;

  allowed := v_count <= p_limit;
  remaining := GREATEST(p_limit - v_count, 0);
  retry_after_seconds := GREATEST(
    CEIL(EXTRACT(EPOCH FROM (v_reset - v_now)))::INTEGER,
    1
  );
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION app_private.consume_public_rate_limit(TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.prune_public_rate_limits(
  p_older_than INTERVAL DEFAULT INTERVAL '1 day'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, pg_temp
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM app_private.public_rate_limits
  WHERE reset_at < clock_timestamp() - p_older_than;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION app_private.prune_public_rate_limits(INTERVAL)
  FROM PUBLIC, anon, authenticated;

COMMIT;
