-- Phase 1.4 tenant RLS verification.
-- Safe to run repeatedly: all data is rolled back.

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public."user" (id, name, email, "emailVerified") VALUES
  ('phase14-owner-a', 'Phase 1.4 Owner A', 'phase14-owner-a@example.test', TRUE),
  ('phase14-owner-b', 'Phase 1.4 Owner B', 'phase14-owner-b@example.test', TRUE),
  ('phase14-collab-a', 'Phase 1.4 Collaborator A', 'phase14-collab-a@example.test', TRUE);

INSERT INTO public.weddings (id, slug, status, template_id, sections, content)
VALUES
  ('11111111-1111-4111-8111-111111111141', 'phase14-ci-a', 'draft', 'classic-001', '[]', '{}'),
  ('11111111-1111-4111-8111-111111111142', 'phase14-ci-b', 'draft', 'classic-001', '[]', '{}');

INSERT INTO public.wedding_collaborators (wedding_id, user_id, role) VALUES
  ('11111111-1111-4111-8111-111111111141', 'phase14-owner-a', 'owner'),
  ('11111111-1111-4111-8111-111111111141', 'phase14-collab-a', 'collaborator'),
  ('11111111-1111-4111-8111-111111111142', 'phase14-owner-b', 'owner');

INSERT INTO public.guests (id, wedding_id, display_name, max_guests, token) VALUES
  ('21111111-1111-4111-8111-111111111141', '11111111-1111-4111-8111-111111111141', 'Tenant A Guest', 2, 'phase14-guest-a'),
  ('21111111-1111-4111-8111-111111111142', '11111111-1111-4111-8111-111111111142', 'Tenant B Guest', 2, 'phase14-guest-b');

-- The browser/public anon role has no direct tenant-table access at all.
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.weddings', 'SELECT')
     OR has_table_privilege('anon', 'public.guests', 'SELECT')
     OR has_table_privilege('anon', 'public.rsvp', 'INSERT')
     OR has_table_privilege('anon', 'public.wishes', 'INSERT') THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: anon has direct tenant-table privileges';
  END IF;

  IF to_regprocedure('public.is_wedding_member(uuid)') IS NOT NULL
     OR to_regprocedure('public.is_wedding_owner(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: SECURITY DEFINER RLS helpers remain in public API schema';
  END IF;

  IF to_regprocedure('app_private.is_wedding_member(uuid)') IS NULL
     OR to_regprocedure('app_private.is_wedding_owner(uuid)') IS NULL
     OR to_regprocedure('app_private.current_better_auth_user_id()') IS NULL THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: private RLS helpers are missing';
  END IF;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'phase14-owner-a', true);

DO $$
DECLARE
  visible_weddings INTEGER;
  visible_guests INTEGER;
  changed_rows INTEGER;
  blocked BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO visible_weddings FROM public.weddings;
  IF visible_weddings <> 1 THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: owner A can see % weddings instead of 1', visible_weddings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.weddings
    WHERE id = '11111111-1111-4111-8111-111111111141'
  ) OR EXISTS (
    SELECT 1 FROM public.weddings
    WHERE id = '11111111-1111-4111-8111-111111111142'
  ) THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: wedding tenant boundary leaked';
  END IF;

  SELECT COUNT(*) INTO visible_guests FROM public.guests;
  IF visible_guests <> 1 THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: owner A can see % guests instead of 1', visible_guests;
  END IF;

  UPDATE public.weddings
  SET theme = '{"cross_tenant":true}'::jsonb
  WHERE id = '11111111-1111-4111-8111-111111111142';
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 0 THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: cross-tenant wedding update succeeded';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO public.guests (wedding_id, display_name, max_guests, token)
    VALUES ('11111111-1111-4111-8111-111111111142', 'Cross Tenant Guest', 1, 'phase14-cross-tenant');
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: cross-tenant guest insert succeeded';
  END IF;
END $$;

-- A collaborator gets the same tenant visibility boundary for the wedding they belong to.
SELECT set_config('app.better_auth_user_id', 'phase14-collab-a', true);
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.weddings) <> 1 THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: collaborator tenant visibility is incorrect';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.weddings
    WHERE id = '11111111-1111-4111-8111-111111111141'
  ) THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: collaborator cannot see assigned wedding';
  END IF;
END $$;

-- Missing Better Auth context must expose no tenant rows.
SELECT set_config('app.better_auth_user_id', '', true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.weddings)
     OR EXISTS (SELECT 1 FROM public.wedding_collaborators)
     OR EXISTS (SELECT 1 FROM public.guests) THEN
    RAISE EXCEPTION 'Phase 1.4 verification failed: missing identity can read tenant data';
  END IF;
END $$;

RESET ROLE;
ROLLBACK;

SELECT 'Phase 1.4 Better Auth tenant RLS verification passed' AS result;
