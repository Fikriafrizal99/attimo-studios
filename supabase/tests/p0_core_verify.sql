-- Core P0 verification. Safe to run repeatedly.
-- This file is used by CI against vanilla PostgreSQL and intentionally does not require the Supabase storage schema.

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  rls_missing_count INTEGER;
  anon_policy_count INTEGER;
  w1 UUID;
  w2 UUID;
  g1 UUID;
  blocked BOOLEAN;
BEGIN
  IF to_regclass('public.weddings') IS NULL
     OR to_regclass('public.wedding_collaborators') IS NULL
     OR to_regclass('public.guests') IS NULL
     OR to_regclass('public.rsvp') IS NULL
     OR to_regclass('public.wishes') IS NULL THEN
    RAISE EXCEPTION 'P0 verification failed: required commerce tables are missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('rsvp', 'wishes')
      AND column_name = 'wedding_id'
      AND is_nullable <> 'NO'
  ) THEN
    RAISE EXCEPTION 'P0 verification failed: RSVP/wishes wedding_id must be NOT NULL';
  END IF;

  SELECT COUNT(*) INTO rls_missing_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('weddings', 'wedding_collaborators', 'guests', 'rsvp', 'wishes')
    AND c.relrowsecurity = FALSE;

  IF rls_missing_count <> 0 THEN
    RAISE EXCEPTION 'P0 verification failed: RLS is not enabled on every tenant table';
  END IF;

  SELECT COUNT(*) INTO anon_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('weddings', 'wedding_collaborators', 'guests', 'rsvp', 'wishes')
    AND 'anon' = ANY(roles);

  IF anon_policy_count <> 0 THEN
    RAISE EXCEPTION 'P0 verification failed: anon must not have direct tenant-table RLS policies';
  END IF;

  IF EXISTS (SELECT 1 FROM weddings WHERE template_id = 'classic') THEN
    RAISE EXCEPTION 'P0 verification failed: legacy classic template IDs remain';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_rsvp_guest_scope' AND NOT tgisinternal
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_wishes_guest_scope' AND NOT tgisinternal
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_rsvp_guest_quota' AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'P0 verification failed: tenant/quota integrity triggers are missing';
  END IF;

  INSERT INTO weddings (slug, status, template_id, sections, content)
  VALUES ('p0-ci-a-' || substr(gen_random_uuid()::text, 1, 8), 'draft', 'classic-001', '[]', '{}')
  RETURNING id INTO w1;

  INSERT INTO weddings (slug, status, template_id, sections, content)
  VALUES ('p0-ci-b-' || substr(gen_random_uuid()::text, 1, 8), 'draft', 'classic-001', '[]', '{}')
  RETURNING id INTO w2;

  INSERT INTO guests (wedding_id, display_name, max_guests, token)
  VALUES (w1, 'P0 Verification Guest', 1, 'verify-' || gen_random_uuid()::text)
  RETURNING id INTO g1;

  blocked := FALSE;
  BEGIN
    INSERT INTO rsvp (wedding_id, guest_id, name, attendance, guest_count)
    VALUES (w2, g1, 'Invalid Cross Tenant', 'yes', 1);
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'P0 verification failed: cross-wedding RSVP guest_id was accepted';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO wishes (wedding_id, guest_id, name, message)
    VALUES (w2, g1, 'Invalid Cross Tenant', 'should be blocked');
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'P0 verification failed: cross-wedding wish guest_id was accepted';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO rsvp (wedding_id, guest_id, name, attendance, guest_count)
    VALUES (w1, g1, 'Over Quota', 'yes', 2);
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'P0 verification failed: guest quota overflow was accepted';
  END IF;
END $$;

ROLLBACK;

SELECT 'Commerce P0 core database verification passed' AS result;
