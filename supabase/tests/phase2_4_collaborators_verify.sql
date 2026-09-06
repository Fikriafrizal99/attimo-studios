\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
VALUES
  ('p24-owner', 'Owner', 'owner-p24@example.com', true, NOW(), NOW()),
  ('p24-existing', 'Existing Collaborator', 'existing-p24@example.com', true, NOW(), NOW());

INSERT INTO public.weddings (id, status, template_id, sections, content, theme)
VALUES (
  '24000000-0000-4000-8000-000000000001',
  'draft',
  'classic-001',
  '[]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb
);

INSERT INTO public.wedding_collaborators (wedding_id, user_id, role)
VALUES ('24000000-0000-4000-8000-000000000001', 'p24-owner', 'owner');

SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'p24-owner', true);

DO $$
DECLARE
  result JSONB;
  collaboration JSONB;
BEGIN
  result := app_private.invite_wedding_collaborator(
    '24000000-0000-4000-8000-000000000001'::uuid,
    ' Existing-P24@Example.com '
  );
  IF result->>'status' <> 'linked' THEN
    RAISE EXCEPTION 'expected existing user to be linked, got %', result;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.wedding_collaborators
     WHERE wedding_id = '24000000-0000-4000-8000-000000000001'::uuid
       AND user_id = 'p24-existing'
       AND role = 'collaborator'
  ) THEN
    RAISE EXCEPTION 'existing registered user was not linked';
  END IF;

  result := app_private.invite_wedding_collaborator(
    '24000000-0000-4000-8000-000000000001'::uuid,
    'pending-p24@example.com'
  );
  IF result->>'status' <> 'pending' THEN
    RAISE EXCEPTION 'expected unknown email to remain pending, got %', result;
  END IF;

  collaboration := app_private.list_wedding_collaboration(
    '24000000-0000-4000-8000-000000000001'::uuid
  );
  IF jsonb_array_length(collaboration->'members') <> 2 THEN
    RAISE EXCEPTION 'expected owner + collaborator in list: %', collaboration;
  END IF;
  IF jsonb_array_length(collaboration->'pending') <> 1 THEN
    RAISE EXCEPTION 'expected one pending invite in list: %', collaboration;
  END IF;
END $$;

-- Collaborator cannot manage or inspect the full collaboration roster.
SELECT set_config('app.better_auth_user_id', 'p24-existing', true);
DO $$
BEGIN
  BEGIN
    PERFORM app_private.list_wedding_collaboration(
      '24000000-0000-4000-8000-000000000001'::uuid
    );
    RAISE EXCEPTION 'collaborator unexpectedly listed collaboration roster';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM app_private.invite_wedding_collaborator(
      '24000000-0000-4000-8000-000000000001'::uuid,
      'blocked-p24@example.com'
    );
    RAISE EXCEPTION 'collaborator unexpectedly invited another user';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;

-- Pending invite is automatically claimable after the invited person signs up.
RESET ROLE;
INSERT INTO public."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
VALUES ('p24-pending', 'Pending Collaborator', 'pending-p24@example.com', true, NOW(), NOW());
SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'p24-pending', true);

DO $$
DECLARE
  claimed INTEGER;
BEGIN
  claimed := app_private.claim_pending_collaborator_invites_for_current_user();
  IF claimed <> 1 THEN
    RAISE EXCEPTION 'expected one claimed invite, got %', claimed;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.wedding_collaborators
     WHERE wedding_id = '24000000-0000-4000-8000-000000000001'::uuid
       AND user_id = 'p24-pending'
       AND role = 'collaborator'
  ) THEN
    RAISE EXCEPTION 'pending invite did not become membership';
  END IF;
END $$;

-- Owner can remove collaborators, but helper cannot remove the owner row.
SELECT set_config('app.better_auth_user_id', 'p24-owner', true);
DO $$
DECLARE
  removed BOOLEAN;
BEGIN
  removed := app_private.remove_wedding_collaborator(
    '24000000-0000-4000-8000-000000000001'::uuid,
    'p24-existing'
  );
  IF NOT removed THEN
    RAISE EXCEPTION 'owner failed to remove collaborator';
  END IF;

  removed := app_private.remove_wedding_collaborator(
    '24000000-0000-4000-8000-000000000001'::uuid,
    'p24-owner'
  );
  IF removed THEN
    RAISE EXCEPTION 'owner row must not be removable through collaborator helper';
  END IF;
END $$;

RESET ROLE;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated', 'app_private.invite_wedding_collaborator(uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated should execute invite helper';
  END IF;
  IF has_function_privilege('anon', 'app_private.invite_wedding_collaborator(uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute invite helper';
  END IF;
END $$;

ROLLBACK;
