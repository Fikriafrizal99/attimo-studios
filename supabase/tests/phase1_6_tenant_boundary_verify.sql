-- Phase 1.6 tenant database boundary verification.
-- Safe to run repeatedly: all data is rolled back.

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public."user" (id, name, email, "emailVerified") VALUES
  ('phase16-owner-a', 'Phase 1.6 Owner A', 'phase16-owner-a@example.test', TRUE),
  ('phase16-owner-b', 'Phase 1.6 Owner B', 'phase16-owner-b@example.test', TRUE);

SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'phase16-owner-a', true);

DO $$
DECLARE
  created JSONB;
  created_id UUID;
BEGIN
  created := app_private.create_wedding_for_current_user(
    'classic-001',
    '[]'::jsonb,
    '{"phase16":"owner-a"}'::jsonb,
    '{}'::jsonb
  );
  created_id := (created->>'id')::uuid;

  IF NOT EXISTS (
    SELECT 1
    FROM public.wedding_collaborators
    WHERE wedding_id = created_id
      AND user_id = 'phase16-owner-a'
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Phase 1.6 verification failed: tenant create did not bind current Better Auth user as owner';
  END IF;
END $$;

RESET ROLE;

-- Seed a second tenant and globally reserved slug as privileged test setup.
INSERT INTO public.weddings (
  id, slug, status, template_id, sections, content, theme
) VALUES (
  '16161616-1616-4161-8161-161616161616',
  'phase16-reserved',
  'draft',
  'classic-001',
  '[]',
  '{}',
  '{}'
);
INSERT INTO public.wedding_collaborators (wedding_id, user_id, role)
VALUES ('16161616-1616-4161-8161-161616161616', 'phase16-owner-b', 'owner');

SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'phase16-owner-a', true);

DO $$
DECLARE
  own_wedding_id UUID;
  available BOOLEAN;
  blocked BOOLEAN := FALSE;
BEGIN
  SELECT id INTO own_wedding_id
  FROM public.weddings
  WHERE content->>'phase16' = 'owner-a'
  LIMIT 1;

  IF own_wedding_id IS NULL THEN
    RAISE EXCEPTION 'Phase 1.6 verification failed: current tenant cannot see own created wedding';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.weddings
    WHERE id = '16161616-1616-4161-8161-161616161616'
  ) THEN
    RAISE EXCEPTION 'Phase 1.6 verification failed: tenant RLS leaked another wedding';
  END IF;

  SELECT app_private.is_wedding_slug_available('phase16-reserved', own_wedding_id)
  INTO available;
  IF available THEN
    RAISE EXCEPTION 'Phase 1.6 verification failed: global slug helper ignored another tenant slug';
  END IF;

  BEGIN
    PERFORM app_private.is_wedding_slug_available(
      'phase16-new',
      '16161616-1616-4161-8161-161616161616'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.6 verification failed: non-owner can use another wedding as slug exclusion';
  END IF;
END $$;

-- Missing identity cannot invoke tenant-aware elevated helpers.
SELECT set_config('app.better_auth_user_id', '', true);
DO $$
DECLARE
  blocked BOOLEAN := FALSE;
BEGIN
  BEGIN
    PERFORM app_private.create_wedding_for_current_user(
      'classic-001', '[]'::jsonb, '{}'::jsonb, '{}'::jsonb
    );
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.6 verification failed: wedding creation succeeded without Better Auth identity';
  END IF;
END $$;

RESET ROLE;
ROLLBACK;

SELECT 'Phase 1.6 tenant database boundary verification passed' AS result;
