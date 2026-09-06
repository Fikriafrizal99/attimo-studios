-- Phase 1.3 database invariant verification.
-- Safe to run repeatedly: all test data is rolled back.

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  owner_user_id TEXT := 'phase13-owner-' || gen_random_uuid()::text;
  collaborator_user_id TEXT := 'phase13-collab-' || gen_random_uuid()::text;
  created JSONB;
  v_wedding_id UUID;
  blocked BOOLEAN;
BEGIN
  INSERT INTO public."user" (id, name, email, "emailVerified")
  VALUES (
    owner_user_id,
    'Phase 1.3 Owner',
    'phase13-owner-' || gen_random_uuid()::text || '@example.test',
    TRUE
  );

  INSERT INTO public."user" (id, name, email, "emailVerified")
  VALUES (
    collaborator_user_id,
    'Phase 1.3 Collaborator',
    'phase13-collab-' || gen_random_uuid()::text || '@example.test',
    TRUE
  );

  SELECT public.create_wedding_with_owner(
    owner_user_id,
    'classic-001',
    '[]'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  ) INTO created;

  v_wedding_id := (created ->> 'id')::uuid;

  IF (
    SELECT COUNT(*)
    FROM public.wedding_collaborators
    WHERE wedding_id = v_wedding_id
      AND role = 'owner'
  ) <> 1 THEN
    RAISE EXCEPTION 'Phase 1.3 verification failed: atomic create did not create exactly one owner';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO public.wedding_collaborators (wedding_id, user_id, role)
    VALUES (v_wedding_id, collaborator_user_id, 'owner');
  EXCEPTION WHEN unique_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.3 verification failed: second owner was accepted';
  END IF;

  blocked := FALSE;
  BEGIN
    DELETE FROM public.wedding_collaborators
    WHERE wedding_id = v_wedding_id
      AND role = 'owner';
    SET CONSTRAINTS ALL IMMEDIATE;
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  SET CONSTRAINTS ALL DEFERRED;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.3 verification failed: deleting the only owner was accepted';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO public.wedding_collaborators (wedding_id, user_id, role)
    VALUES (v_wedding_id, 'missing-user-' || gen_random_uuid()::text, 'collaborator');
  EXCEPTION WHEN foreign_key_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.3 verification failed: orphan collaborator user_id was accepted';
  END IF;

  blocked := FALSE;
  BEGIN
    UPDATE public.weddings
    SET slug = 'INVALID SLUG'
    WHERE id = v_wedding_id;
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.3 verification failed: invalid slug was accepted';
  END IF;

  blocked := FALSE;
  BEGIN
    UPDATE public.weddings
    SET status = 'released'
    WHERE id = v_wedding_id;
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 1.3 verification failed: release without slug/published_at was accepted';
  END IF;
END $$;

ROLLBACK;

SELECT 'Phase 1.3 database invariant verification passed' AS result;
