-- Phase 8.1: shared abuse-control infrastructure for public invitation forms.
-- This limiter is intentionally database-backed so multiple app instances share
-- the same counters. Public/browser roles cannot read or mutate the table.

CREATE SCHEMA IF NOT EXISTS app_private;

CREATE TABLE IF NOT EXISTS app_private.public_rate_limits (
  rate_key text PRIMARY KEY,
  request_count integer NOT NULL CHECK (request_count >= 0),
  window_started_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE app_private.public_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.consume_public_rate_limit(
  p_rate_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, app_private
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_started timestamptz;
  v_window interval;
BEGIN
  IF p_rate_key IS NULL OR length(p_rate_key) < 1 OR length(p_rate_key) > 512 THEN
    RAISE EXCEPTION 'invalid rate-limit key';
  END IF;
  IF p_limit < 1 OR p_limit > 100000 THEN
    RAISE EXCEPTION 'invalid rate-limit limit';
  END IF;
  IF p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid rate-limit window';
  END IF;

  v_window := make_interval(secs => p_window_seconds);

  INSERT INTO app_private.public_rate_limits AS limits (
    rate_key,
    request_count,
    window_started_at,
    updated_at
  )
  VALUES (p_rate_key, 1, v_now, v_now)
  ON CONFLICT (rate_key) DO UPDATE
  SET
    request_count = CASE
      WHEN limits.window_started_at + v_window <= v_now THEN 1
      ELSE limits.request_count + 1
    END,
    window_started_at = CASE
      WHEN limits.window_started_at + v_window <= v_now THEN v_now
      ELSE limits.window_started_at
    END,
    updated_at = v_now
  RETURNING request_count, window_started_at
  INTO v_count, v_started;

  allowed := v_count <= p_limit;
  remaining := GREATEST(p_limit - v_count, 0);
  retry_after_seconds := GREATEST(
    CEIL(EXTRACT(EPOCH FROM ((v_started + v_window) - v_now)))::integer,
    1
  );
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION app_private.consume_public_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.consume_public_rate_limit(text, integer, integer) TO service_role;

COMMENT ON TABLE app_private.public_rate_limits IS
  'Shared public endpoint abuse-control counters. Server/service access only.';
COMMENT ON FUNCTION app_private.consume_public_rate_limit(text, integer, integer) IS
  'Atomically consumes one request in a fixed rate-limit window and returns allowance metadata.';
