-- Phase 1.5: owner/collaborator permission matrix.
-- Collaborators may edit wedding content and section config only.
-- Owner-only: wedding settings/publish state, guest/RSVP/wish management,
-- collaborator management, and wedding deletion.

BEGIN;

-- Collaborators may see only their own membership row. Owners may see the
-- full membership list for collaborator management.
DROP POLICY IF EXISTS wedding_collaborators_member_select ON public.wedding_collaborators;
DROP POLICY IF EXISTS wedding_collaborators_owner_or_self_select ON public.wedding_collaborators;
CREATE POLICY wedding_collaborators_owner_or_self_select
  ON public.wedding_collaborators
  FOR SELECT
  TO authenticated
  USING (
    app_private.is_wedding_owner(wedding_id)
    OR user_id = app_private.current_better_auth_user_id()
  );

-- Guest-facing operational data is owner-managed in the dashboard. Public
-- guest access continues through server-mediated invitation/RSVP routes.
DROP POLICY IF EXISTS guests_member_select ON public.guests;
DROP POLICY IF EXISTS guests_member_insert ON public.guests;
DROP POLICY IF EXISTS guests_member_update ON public.guests;
DROP POLICY IF EXISTS guests_member_delete ON public.guests;
DROP POLICY IF EXISTS guests_owner_select ON public.guests;
DROP POLICY IF EXISTS guests_owner_insert ON public.guests;
DROP POLICY IF EXISTS guests_owner_update ON public.guests;
DROP POLICY IF EXISTS guests_owner_delete ON public.guests;

CREATE POLICY guests_owner_select
  ON public.guests
  FOR SELECT
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id));
CREATE POLICY guests_owner_insert
  ON public.guests
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.is_wedding_owner(wedding_id));
CREATE POLICY guests_owner_update
  ON public.guests
  FOR UPDATE
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id))
  WITH CHECK (app_private.is_wedding_owner(wedding_id));
CREATE POLICY guests_owner_delete
  ON public.guests
  FOR DELETE
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id));

DROP POLICY IF EXISTS rsvp_member_select ON public.rsvp;
DROP POLICY IF EXISTS rsvp_member_insert ON public.rsvp;
DROP POLICY IF EXISTS rsvp_member_update ON public.rsvp;
DROP POLICY IF EXISTS rsvp_member_delete ON public.rsvp;
DROP POLICY IF EXISTS rsvp_owner_select ON public.rsvp;
DROP POLICY IF EXISTS rsvp_owner_insert ON public.rsvp;
DROP POLICY IF EXISTS rsvp_owner_update ON public.rsvp;
DROP POLICY IF EXISTS rsvp_owner_delete ON public.rsvp;

CREATE POLICY rsvp_owner_select
  ON public.rsvp
  FOR SELECT
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id));
CREATE POLICY rsvp_owner_insert
  ON public.rsvp
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.is_wedding_owner(wedding_id));
CREATE POLICY rsvp_owner_update
  ON public.rsvp
  FOR UPDATE
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id))
  WITH CHECK (app_private.is_wedding_owner(wedding_id));
CREATE POLICY rsvp_owner_delete
  ON public.rsvp
  FOR DELETE
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id));

DROP POLICY IF EXISTS wishes_member_select ON public.wishes;
DROP POLICY IF EXISTS wishes_member_insert ON public.wishes;
DROP POLICY IF EXISTS wishes_member_update ON public.wishes;
DROP POLICY IF EXISTS wishes_member_delete ON public.wishes;
DROP POLICY IF EXISTS wishes_owner_select ON public.wishes;
DROP POLICY IF EXISTS wishes_owner_insert ON public.wishes;
DROP POLICY IF EXISTS wishes_owner_update ON public.wishes;
DROP POLICY IF EXISTS wishes_owner_delete ON public.wishes;

CREATE POLICY wishes_owner_select
  ON public.wishes
  FOR SELECT
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id));
CREATE POLICY wishes_owner_insert
  ON public.wishes
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.is_wedding_owner(wedding_id));
CREATE POLICY wishes_owner_update
  ON public.wishes
  FOR UPDATE
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id))
  WITH CHECK (app_private.is_wedding_owner(wedding_id));
CREATE POLICY wishes_owner_delete
  ON public.wishes
  FOR DELETE
  TO authenticated
  USING (app_private.is_wedding_owner(wedding_id));

-- Row-level RLS cannot by itself restrict which columns a collaborator changes.
-- This trigger provides the column-level invariant when an authenticated
-- Better Auth context is present. Service-role server routes have no Better
-- Auth DB context and are guarded separately by application authorization.
CREATE OR REPLACE FUNCTION app_private.enforce_wedding_update_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor_user_id TEXT;
BEGIN
  actor_user_id := app_private.current_better_auth_user_id();

  -- Internal/service operations without a Better Auth identity are handled by
  -- the server authorization layer and are not constrained by this trigger.
  IF actor_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF app_private.is_wedding_owner(OLD.id) THEN
    RETURN NEW;
  END IF;

  IF NOT app_private.is_wedding_member(OLD.id) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'wedding update requires membership';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.template_id IS DISTINCT FROM OLD.template_id
     OR NEW.theme IS DISTINCT FROM OLD.theme
     OR NEW.published_at IS DISTINCT FROM OLD.published_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'collaborators may update wedding content and sections only';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app_private.enforce_wedding_update_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.enforce_wedding_update_role() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_wedding_update_role_guard ON public.weddings;
CREATE TRIGGER trg_wedding_update_role_guard
BEFORE UPDATE ON public.weddings
FOR EACH ROW
EXECUTE FUNCTION app_private.enforce_wedding_update_role();

COMMIT;
