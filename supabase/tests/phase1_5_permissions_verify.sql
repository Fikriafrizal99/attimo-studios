-- Phase 1.5 owner/collaborator permission matrix verification.
-- Safe to run repeatedly: all data is rolled back.

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public."user" (id, name, email, "emailVerified") VALUES
  ('phase15-owner', 'Phase 1.5 Owner', 'phase15-owner@example.test', TRUE),
  ('phase15-collab', 'Phase 1.5 Collaborator', 'phase15-collab@example.test', TRUE);

INSERT INTO public.weddings (
  id, slug, status, template_id, sections, content, theme
) VALUES (
  '15111111-1111-4111-8111-111111111151',
  'phase15-ci',
  'draft',
  'classic-001',
  '[]',
  '{}',
  '{}'
);

INSERT INTO public.wedding_collaborators (wedding_id, user_id, role) VALUES
  ('15111111-1111-4111-8111-111111111151', 'phase15-owner', 'owner'),
  ('15111111-1111-4111-8111-111111111151', 'phase15-collab', 'collaborator');

INSERT INTO public.guests (
  id, wedding_id, display_name, max_guests, token
) VALUES (
  '25111111-1111-4111-8111-111111111151',
  '15111111-1111-4111-8111-111111111151',
  'Phase 1.5 Guest',
  2,
  'phase15-guest'
);

INSERT INTO public.rsvp (
  wedding_id, guest_id, name, attendance, guest_count
) VALUES (
  '15111111-1111-4111-8111-111111111151',
  '25111111-1111-4111-8111-111111111151',
  'Phase 1.5 Guest',
  'yes',
  1
);

INSERT INTO public.wishes (
  wedding_id, guest_id, name, message
) VALUES (
  '15111111-1111-4111-8111-111111111151',
  '25111111-1111-4111-8111-111111111151',
  'Phase 1.5 Guest',
  'Congratulations'
);

SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'phase15-collab', true);

DO $$
DECLARE
  changed_rows INTEGER;
  blocked BOOLEAN;
BEGIN
  -- Collaborator can read the assigned wedding and edit content/sections.
  IF (SELECT COUNT(*) FROM public.weddings) <> 1 THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator cannot read assigned wedding';
  END IF;

  UPDATE public.weddings
  SET content = '{"phase15":"content-ok"}'::jsonb
  WHERE id = '15111111-1111-4111-8111-111111111151';
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 1 THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator content update was blocked';
  END IF;

  UPDATE public.weddings
  SET sections = '[{"id":"hero","enabled":true,"order":0}]'::jsonb
  WHERE id = '15111111-1111-4111-8111-111111111151';
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 1 THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator sections update was blocked';
  END IF;

  -- Owner-only wedding fields must be rejected for collaborators.
  blocked := FALSE;
  BEGIN
    UPDATE public.weddings
    SET slug = 'phase15-collab-forbidden'
    WHERE id = '15111111-1111-4111-8111-111111111151';
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator changed slug';
  END IF;

  blocked := FALSE;
  BEGIN
    UPDATE public.weddings
    SET template_id = 'minimal-001'
    WHERE id = '15111111-1111-4111-8111-111111111151';
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator changed template';
  END IF;

  blocked := FALSE;
  BEGIN
    UPDATE public.weddings
    SET theme = '{"forbidden":true}'::jsonb
    WHERE id = '15111111-1111-4111-8111-111111111151';
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator changed theme';
  END IF;

  blocked := FALSE;
  BEGIN
    UPDATE public.weddings
    SET status = 'released', published_at = now()
    WHERE id = '15111111-1111-4111-8111-111111111151';
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator changed publish state';
  END IF;

  -- Collaborator sees only their own membership row, not the owner/list.
  IF (SELECT COUNT(*) FROM public.wedding_collaborators) <> 1
     OR NOT EXISTS (
       SELECT 1 FROM public.wedding_collaborators
       WHERE user_id = 'phase15-collab' AND role = 'collaborator'
     ) THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator membership visibility is too broad';
  END IF;

  -- Operational guest data is owner-only.
  IF EXISTS (SELECT 1 FROM public.guests)
     OR EXISTS (SELECT 1 FROM public.rsvp)
     OR EXISTS (SELECT 1 FROM public.wishes) THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator can read owner-only guest data';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO public.guests (wedding_id, display_name, max_guests, token)
    VALUES (
      '15111111-1111-4111-8111-111111111151',
      'Forbidden Collaborator Guest',
      1,
      'phase15-forbidden-guest'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator created guest';
  END IF;

  DELETE FROM public.weddings
  WHERE id = '15111111-1111-4111-8111-111111111151';
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 0 THEN
    RAISE EXCEPTION 'Phase 1.5 failed: collaborator deleted wedding';
  END IF;
END $$;

-- Owner receives the management side of the matrix.
SELECT set_config('app.better_auth_user_id', 'phase15-owner', true);

DO $$
DECLARE
  changed_rows INTEGER;
BEGIN
  IF (SELECT COUNT(*) FROM public.wedding_collaborators) <> 2 THEN
    RAISE EXCEPTION 'Phase 1.5 failed: owner cannot see collaborator list';
  END IF;

  IF (SELECT COUNT(*) FROM public.guests) <> 1
     OR (SELECT COUNT(*) FROM public.rsvp) <> 1
     OR (SELECT COUNT(*) FROM public.wishes) <> 1 THEN
    RAISE EXCEPTION 'Phase 1.5 failed: owner cannot see guest operational data';
  END IF;

  UPDATE public.weddings
  SET slug = 'phase15-owner-updated', template_id = 'minimal-001'
  WHERE id = '15111111-1111-4111-8111-111111111151';
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 1 THEN
    RAISE EXCEPTION 'Phase 1.5 failed: owner cannot change wedding settings';
  END IF;

  INSERT INTO public.guests (wedding_id, display_name, max_guests, token)
  VALUES (
    '15111111-1111-4111-8111-111111111151',
    'Owner Managed Guest',
    1,
    'phase15-owner-guest'
  );

  DELETE FROM public.wedding_collaborators
  WHERE wedding_id = '15111111-1111-4111-8111-111111111151'
    AND user_id = 'phase15-collab';
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 1 THEN
    RAISE EXCEPTION 'Phase 1.5 failed: owner cannot manage collaborators';
  END IF;
END $$;

RESET ROLE;
ROLLBACK;

SELECT 'Phase 1.5 owner/collaborator permission matrix verification passed' AS result;
