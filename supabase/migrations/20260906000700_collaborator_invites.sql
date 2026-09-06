-- Phase 2.4: secure collaborator management and invite-by-email flow.
-- Better Auth user rows remain private. Owners use narrow SECURITY DEFINER
-- helpers to resolve an email, manage memberships, and hold pending invites.

BEGIN;

CREATE TABLE IF NOT EXISTS app_private.wedding_collaborator_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS wedding_collaborator_invites_wedding_email_uidx
  ON app_private.wedding_collaborator_invites (wedding_id, (lower(email)));

REVOKE ALL ON TABLE app_private.wedding_collaborator_invites
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.invite_wedding_collaborator(
  p_wedding_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor_user_id TEXT;
  normalized_email TEXT;
  actor_email TEXT;
  target_user RECORD;
  existing_role TEXT;
  invite_id UUID;
BEGIN
  actor_user_id := app_private.current_better_auth_user_id();
  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Better Auth identity is required';
  END IF;

  IF NOT app_private.is_wedding_owner(p_wedding_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'only the wedding owner may manage collaborators';
  END IF;

  normalized_email := lower(btrim(COALESCE(p_email, '')));
  IF normalized_email = ''
     OR normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'valid collaborator email is required';
  END IF;

  SELECT lower(email)
    INTO actor_email
    FROM public."user"
   WHERE id = actor_user_id;

  IF actor_email = normalized_email THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'owner is already a member of this wedding';
  END IF;

  SELECT u.id, u.name, u.email
    INTO target_user
    FROM public."user" u
   WHERE lower(u.email) = normalized_email
   LIMIT 1;

  IF target_user.id IS NOT NULL THEN
    SELECT role
      INTO existing_role
      FROM public.wedding_collaborators
     WHERE wedding_id = p_wedding_id
       AND user_id = target_user.id;

    IF existing_role IS NOT NULL THEN
      RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'user already has access to this wedding';
    END IF;

    INSERT INTO public.wedding_collaborators (wedding_id, user_id, role)
    VALUES (p_wedding_id, target_user.id, 'collaborator');

    DELETE FROM app_private.wedding_collaborator_invites
     WHERE wedding_id = p_wedding_id
       AND lower(email) = normalized_email;

    RETURN jsonb_build_object(
      'status', 'linked',
      'user_id', target_user.id,
      'name', target_user.name,
      'email', target_user.email
    );
  END IF;

  SELECT id
    INTO invite_id
    FROM app_private.wedding_collaborator_invites
   WHERE wedding_id = p_wedding_id
     AND lower(email) = normalized_email;

  IF invite_id IS NULL THEN
    INSERT INTO app_private.wedding_collaborator_invites (
      wedding_id,
      email,
      invited_by_user_id
    )
    VALUES (p_wedding_id, normalized_email, actor_user_id)
    RETURNING id INTO invite_id;
  ELSE
    UPDATE app_private.wedding_collaborator_invites
       SET invited_by_user_id = actor_user_id,
           created_at = NOW(),
           email = normalized_email
     WHERE id = invite_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'pending',
    'invite_id', invite_id,
    'email', normalized_email
  );
END;
$$;

CREATE OR REPLACE FUNCTION app_private.list_wedding_collaboration(
  p_wedding_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor_user_id TEXT;
  members JSONB;
  pending JSONB;
BEGIN
  actor_user_id := app_private.current_better_auth_user_id();
  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Better Auth identity is required';
  END IF;

  IF NOT app_private.is_wedding_owner(p_wedding_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'only the wedding owner may manage collaborators';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'user_id', wc.user_id,
        'role', wc.role,
        'invited_at', wc.invited_at,
        'name', u.name,
        'email', u.email
      )
      ORDER BY CASE WHEN wc.role = 'owner' THEN 0 ELSE 1 END, wc.invited_at
    ),
    '[]'::jsonb
  )
  INTO members
  FROM public.wedding_collaborators wc
  JOIN public."user" u ON u.id = wc.user_id
  WHERE wc.wedding_id = p_wedding_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'invite_id', i.id,
        'email', i.email,
        'created_at', i.created_at
      )
      ORDER BY i.created_at
    ),
    '[]'::jsonb
  )
  INTO pending
  FROM app_private.wedding_collaborator_invites i
  WHERE i.wedding_id = p_wedding_id;

  RETURN jsonb_build_object('members', members, 'pending', pending);
END;
$$;

CREATE OR REPLACE FUNCTION app_private.remove_wedding_collaborator(
  p_wedding_id UUID,
  p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor_user_id TEXT;
  deleted_count INTEGER;
BEGIN
  actor_user_id := app_private.current_better_auth_user_id();
  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Better Auth identity is required';
  END IF;

  IF NOT app_private.is_wedding_owner(p_wedding_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'only the wedding owner may manage collaborators';
  END IF;

  DELETE FROM public.wedding_collaborators
   WHERE wedding_id = p_wedding_id
     AND user_id = p_user_id
     AND role = 'collaborator';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION app_private.revoke_wedding_collaborator_invite(
  p_wedding_id UUID,
  p_invite_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor_user_id TEXT;
  deleted_count INTEGER;
BEGIN
  actor_user_id := app_private.current_better_auth_user_id();
  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Better Auth identity is required';
  END IF;

  IF NOT app_private.is_wedding_owner(p_wedding_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'only the wedding owner may manage collaborators';
  END IF;

  DELETE FROM app_private.wedding_collaborator_invites
   WHERE wedding_id = p_wedding_id
     AND id = p_invite_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION app_private.claim_pending_collaborator_invites_for_current_user()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor_user_id TEXT;
  actor_email TEXT;
  invitation RECORD;
  claimed_count INTEGER := 0;
BEGIN
  actor_user_id := app_private.current_better_auth_user_id();
  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Better Auth identity is required';
  END IF;

  SELECT lower(email)
    INTO actor_email
    FROM public."user"
   WHERE id = actor_user_id;

  IF actor_email IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Better Auth user does not exist';
  END IF;

  FOR invitation IN
    SELECT id, wedding_id, created_at
      FROM app_private.wedding_collaborator_invites
     WHERE lower(email) = actor_email
     ORDER BY created_at
     FOR UPDATE
  LOOP
    INSERT INTO public.wedding_collaborators (wedding_id, user_id, role, invited_at)
    VALUES (invitation.wedding_id, actor_user_id, 'collaborator', invitation.created_at)
    ON CONFLICT (wedding_id, user_id) DO NOTHING;

    DELETE FROM app_private.wedding_collaborator_invites
     WHERE id = invitation.id;

    claimed_count := claimed_count + 1;
  END LOOP;

  RETURN claimed_count;
END;
$$;

REVOKE ALL ON FUNCTION app_private.invite_wedding_collaborator(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.list_wedding_collaboration(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.remove_wedding_collaborator(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.revoke_wedding_collaborator_invite(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.claim_pending_collaborator_invites_for_current_user() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION app_private.invite_wedding_collaborator(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.list_wedding_collaboration(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.remove_wedding_collaborator(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.revoke_wedding_collaborator_invite(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.claim_pending_collaborator_invites_for_current_user() TO authenticated;

COMMIT;
