-- Phase 8.1 shared rate-limit verification.
-- Safe to run repeatedly: transaction is rolled back.

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  r RECORD;
  attempt INTEGER;
BEGIN
  IF to_regclass('public."rateLimit"') IS NULL THEN
    RAISE EXCEPTION 'Phase 8.1 verification failed: Better Auth rateLimit table missing';
  END IF;

  IF to_regclass('app_private.public_rate_limits') IS NULL THEN
    RAISE EXCEPTION 'Phase 8.1 verification failed: public rate-limit table missing';
  END IF;

  IF has_table_privilege('authenticated', 'public."rateLimit"', 'SELECT')
     OR has_table_privilege('authenticated', 'app_private.public_rate_limits', 'SELECT') THEN
    RAISE EXCEPTION 'Phase 8.1 verification failed: browser role can read rate-limit state';
  END IF;

  IF has_function_privilege(
    'authenticated',
    'app_private.consume_public_rate_limit(text,integer,integer)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Phase 8.1 verification failed: browser role can consume shared limiter directly';
  END IF;

  DELETE FROM app_private.public_rate_limits
   WHERE rate_key = 'phase8-test-rate-limit';

  FOR attempt IN 1..4 LOOP
    SELECT * INTO r
      FROM app_private.consume_public_rate_limit(
        'phase8-test-rate-limit',
        3,
        600
      );

    IF attempt <= 3 AND NOT r.allowed THEN
      RAISE EXCEPTION 'Phase 8.1 verification failed: request % should be allowed', attempt;
    END IF;
    IF attempt = 4 AND r.allowed THEN
      RAISE EXCEPTION 'Phase 8.1 verification failed: request 4 should be blocked';
    END IF;
  END LOOP;

  IF r.remaining <> 0 OR r.retry_after_seconds < 1 THEN
    RAISE EXCEPTION 'Phase 8.1 verification failed: invalid blocked response metadata';
  END IF;
END $$;

ROLLBACK;

SELECT 'Phase 8.1 shared security rate-limit verification passed' AS result;
