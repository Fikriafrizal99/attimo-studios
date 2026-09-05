-- Better Auth 1.4.19 production verification.
-- Read-only checks; safe to run after the corresponding migration.

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['user', 'session', 'account', 'verification'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION 'Better Auth verification failed: table % is missing', table_name;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = table_name
        AND c.relrowsecurity = TRUE
    ) THEN
      RAISE EXCEPTION 'Better Auth verification failed: RLS is not enabled on %', table_name;
    END IF;
  END LOOP;

  IF has_table_privilege('anon', 'public.user', 'SELECT')
     OR has_table_privilege('authenticated', 'public.user', 'SELECT')
     OR has_table_privilege('anon', 'public.account', 'SELECT')
     OR has_table_privilege('authenticated', 'public.account', 'SELECT')
     OR has_table_privilege('anon', 'public.session', 'SELECT')
     OR has_table_privilege('authenticated', 'public.session', 'SELECT') THEN
    RAISE EXCEPTION 'Better Auth verification failed: browser roles have direct auth-table read privileges';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'user'
      AND constraint_type = 'UNIQUE' AND constraint_name ILIKE '%email%'
  ) THEN
    RAISE EXCEPTION 'Better Auth verification failed: unique email constraint missing';
  END IF;
END $$;

SELECT 'Better Auth 1.4.19 production verification passed' AS result;
