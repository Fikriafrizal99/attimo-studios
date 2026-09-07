\set ON_ERROR_STOP on

DO $$
DECLARE
  r record;
BEGIN
  DELETE FROM app_private.public_rate_limits WHERE rate_key = 'phase8:test';

  SELECT * INTO r FROM app_private.consume_public_rate_limit('phase8:test', 2, 60);
  IF NOT r.allowed OR r.remaining <> 1 THEN
    RAISE EXCEPTION 'first rate-limit consume returned unexpected result: %', row_to_json(r);
  END IF;

  SELECT * INTO r FROM app_private.consume_public_rate_limit('phase8:test', 2, 60);
  IF NOT r.allowed OR r.remaining <> 0 THEN
    RAISE EXCEPTION 'second rate-limit consume returned unexpected result: %', row_to_json(r);
  END IF;

  SELECT * INTO r FROM app_private.consume_public_rate_limit('phase8:test', 2, 60);
  IF r.allowed OR r.remaining <> 0 OR r.retry_after_seconds < 1 THEN
    RAISE EXCEPTION 'third rate-limit consume must be blocked: %', row_to_json(r);
  END IF;
END $$;

DO $$
BEGIN
  IF has_table_privilege('authenticated', 'app_private.public_rate_limits', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not SELECT public rate-limit counters';
  END IF;
  IF has_table_privilege('anon', 'app_private.public_rate_limits', 'INSERT') THEN
    RAISE EXCEPTION 'anon must not INSERT public rate-limit counters';
  END IF;
  IF has_function_privilege('authenticated', 'app_private.consume_public_rate_limit(text,integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must not execute shared rate limiter directly';
  END IF;
END $$;

DELETE FROM app_private.public_rate_limits WHERE rate_key = 'phase8:test';
