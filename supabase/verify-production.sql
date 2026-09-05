-- Production-only P0 verification for Supabase SQL Editor.
-- Run after `supabase/run-weddings-migrations.sql` and Better Auth migration.

BEGIN;

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'wedding-assets'
      AND public = TRUE
      AND file_size_limit = 5242880
  ) THEN
    RAISE EXCEPTION 'P0 production verification failed: wedding-assets bucket missing/misconfigured';
  END IF;

  IF EXISTS (
    SELECT 1 FROM rsvp WHERE wedding_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM wishes WHERE wedding_id IS NULL
  ) THEN
    RAISE EXCEPTION 'P0 production verification failed: unscoped RSVP/wishes rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('weddings', 'wedding_collaborators', 'guests', 'rsvp', 'wishes')
      AND c.relrowsecurity = FALSE
  ) THEN
    RAISE EXCEPTION 'P0 production verification failed: RLS missing on tenant table';
  END IF;

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('weddings', 'wedding_collaborators', 'guests', 'rsvp', 'wishes');

  IF policy_count <> 0 THEN
    RAISE EXCEPTION 'P0 production verification failed: tenant tables have direct RLS policies; P0 expects server-only access';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rsvp_guest_scope' AND NOT tgisinternal
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wishes_guest_scope' AND NOT tgisinternal
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rsvp_guest_quota' AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'P0 production verification failed: integrity triggers missing';
  END IF;
END $$;

ROLLBACK;

SELECT 'Commerce P0 Supabase production verification passed' AS result;
