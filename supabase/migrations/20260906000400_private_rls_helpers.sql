-- Phase 1.4 hardening: keep SECURITY DEFINER RLS helpers outside the exposed public schema.
-- Authenticated users still need EXECUTE so PostgreSQL can evaluate RLS policies,
-- but app_private is not an exposed PostgREST API schema.

BEGIN;

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
REVOKE ALL ON SCHEMA app_private FROM anon;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.current_better_auth_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = app_private, public, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.better_auth_user_id', true), ''),
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'better_auth_user_id'
  );
$$;

CREATE OR REPLACE FUNCTION app_private.is_wedding_member(p_wedding_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wedding_collaborators wc
    WHERE wc.wedding_id = p_wedding_id
      AND wc.user_id = app_private.current_better_auth_user_id()
  );
$$;

CREATE OR REPLACE FUNCTION app_private.is_wedding_owner(p_wedding_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wedding_collaborators wc
    WHERE wc.wedding_id = p_wedding_id
      AND wc.user_id = app_private.current_better_auth_user_id()
      AND wc.role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION app_private.current_better_auth_user_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.is_wedding_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.is_wedding_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.current_better_auth_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.is_wedding_member(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.is_wedding_owner(UUID) TO authenticated, service_role;

ALTER POLICY weddings_member_select ON public.weddings
  USING (app_private.is_wedding_member(id));
ALTER POLICY weddings_member_update ON public.weddings
  USING (app_private.is_wedding_member(id))
  WITH CHECK (app_private.is_wedding_member(id));
ALTER POLICY weddings_owner_delete ON public.weddings
  USING (app_private.is_wedding_owner(id));

ALTER POLICY wedding_collaborators_member_select ON public.wedding_collaborators
  USING (app_private.is_wedding_member(wedding_id));
ALTER POLICY wedding_collaborators_owner_insert ON public.wedding_collaborators
  WITH CHECK (app_private.is_wedding_owner(wedding_id));
ALTER POLICY wedding_collaborators_owner_update ON public.wedding_collaborators
  USING (app_private.is_wedding_owner(wedding_id))
  WITH CHECK (app_private.is_wedding_owner(wedding_id));
ALTER POLICY wedding_collaborators_owner_delete ON public.wedding_collaborators
  USING (app_private.is_wedding_owner(wedding_id));

ALTER POLICY guests_member_select ON public.guests
  USING (app_private.is_wedding_member(wedding_id));
ALTER POLICY guests_member_insert ON public.guests
  WITH CHECK (app_private.is_wedding_member(wedding_id));
ALTER POLICY guests_member_update ON public.guests
  USING (app_private.is_wedding_member(wedding_id))
  WITH CHECK (app_private.is_wedding_member(wedding_id));
ALTER POLICY guests_member_delete ON public.guests
  USING (app_private.is_wedding_member(wedding_id));

ALTER POLICY rsvp_member_select ON public.rsvp
  USING (app_private.is_wedding_member(wedding_id));
ALTER POLICY rsvp_member_insert ON public.rsvp
  WITH CHECK (app_private.is_wedding_member(wedding_id));
ALTER POLICY rsvp_member_update ON public.rsvp
  USING (app_private.is_wedding_member(wedding_id))
  WITH CHECK (app_private.is_wedding_member(wedding_id));
ALTER POLICY rsvp_member_delete ON public.rsvp
  USING (app_private.is_wedding_member(wedding_id));

ALTER POLICY wishes_member_select ON public.wishes
  USING (app_private.is_wedding_member(wedding_id));
ALTER POLICY wishes_member_insert ON public.wishes
  WITH CHECK (app_private.is_wedding_member(wedding_id));
ALTER POLICY wishes_member_update ON public.wishes
  USING (app_private.is_wedding_member(wedding_id))
  WITH CHECK (app_private.is_wedding_member(wedding_id));
ALTER POLICY wishes_member_delete ON public.wishes
  USING (app_private.is_wedding_member(wedding_id));

-- Remove API-exposed helper functions after all policies have been repointed.
DROP FUNCTION IF EXISTS public.is_wedding_owner(UUID);
DROP FUNCTION IF EXISTS public.is_wedding_member(UUID);
DROP FUNCTION IF EXISTS public.current_better_auth_user_id();

COMMIT;
