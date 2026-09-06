-- Phase 1.4: real multi-tenant RLS for Better Auth users.
-- Public invitation/RSVP routes remain server-mediated and do not require login.

BEGIN;

-- Better Auth does not use Supabase Auth, so tenant RLS reads a Better Auth
-- user id from transaction/request context instead of auth.uid().
CREATE OR REPLACE FUNCTION public.current_better_auth_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.better_auth_user_id', true), ''),
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'better_auth_user_id'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_wedding_member(p_wedding_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wedding_collaborators wc
    WHERE wc.wedding_id = p_wedding_id
      AND wc.user_id = public.current_better_auth_user_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_wedding_owner(p_wedding_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wedding_collaborators wc
    WHERE wc.wedding_id = p_wedding_id
      AND wc.user_id = public.current_better_auth_user_id()
      AND wc.role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.current_better_auth_user_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_wedding_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_wedding_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_better_auth_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_wedding_member(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_wedding_owner(UUID) TO authenticated, service_role;

-- The public browser role must never access tenant tables directly. Public
-- invitation rendering and guest submissions are resolved by server routes.
REVOKE ALL ON TABLE public.weddings FROM anon;
REVOKE ALL ON TABLE public.wedding_collaborators FROM anon;
REVOKE ALL ON TABLE public.guests FROM anon;
REVOKE ALL ON TABLE public.rsvp FROM anon;
REVOKE ALL ON TABLE public.wishes FROM anon;

-- Restrict authenticated to ordinary DML only. RLS below supplies tenant scope.
REVOKE ALL ON TABLE public.weddings FROM authenticated;
REVOKE ALL ON TABLE public.wedding_collaborators FROM authenticated;
REVOKE ALL ON TABLE public.guests FROM authenticated;
REVOKE ALL ON TABLE public.rsvp FROM authenticated;
REVOKE ALL ON TABLE public.wishes FROM authenticated;

GRANT SELECT, UPDATE, DELETE ON TABLE public.weddings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wedding_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rsvp TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wishes TO authenticated;

ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

-- Remove any legacy/direct-public policies before installing the canonical set.
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('weddings', 'wedding_collaborators', 'guests', 'rsvp', 'wishes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- Wedding rows: members can read/update; only owner can delete.
CREATE POLICY weddings_member_select
  ON public.weddings
  FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(id));

CREATE POLICY weddings_member_update
  ON public.weddings
  FOR UPDATE
  TO authenticated
  USING (public.is_wedding_member(id))
  WITH CHECK (public.is_wedding_member(id));

CREATE POLICY weddings_owner_delete
  ON public.weddings
  FOR DELETE
  TO authenticated
  USING (public.is_wedding_owner(id));

-- Membership rows: members can see their wedding membership. Mutation is owner-only.
CREATE POLICY wedding_collaborators_member_select
  ON public.wedding_collaborators
  FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

CREATE POLICY wedding_collaborators_owner_insert
  ON public.wedding_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_wedding_owner(wedding_id));

CREATE POLICY wedding_collaborators_owner_update
  ON public.wedding_collaborators
  FOR UPDATE
  TO authenticated
  USING (public.is_wedding_owner(wedding_id))
  WITH CHECK (public.is_wedding_owner(wedding_id));

CREATE POLICY wedding_collaborators_owner_delete
  ON public.wedding_collaborators
  FOR DELETE
  TO authenticated
  USING (public.is_wedding_owner(wedding_id));

-- Tenant child tables: any wedding member may manage rows for that wedding.
CREATE POLICY guests_member_select
  ON public.guests
  FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

CREATE POLICY guests_member_insert
  ON public.guests
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_wedding_member(wedding_id));

CREATE POLICY guests_member_update
  ON public.guests
  FOR UPDATE
  TO authenticated
  USING (public.is_wedding_member(wedding_id))
  WITH CHECK (public.is_wedding_member(wedding_id));

CREATE POLICY guests_member_delete
  ON public.guests
  FOR DELETE
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

CREATE POLICY rsvp_member_select
  ON public.rsvp
  FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

CREATE POLICY rsvp_member_insert
  ON public.rsvp
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_wedding_member(wedding_id));

CREATE POLICY rsvp_member_update
  ON public.rsvp
  FOR UPDATE
  TO authenticated
  USING (public.is_wedding_member(wedding_id))
  WITH CHECK (public.is_wedding_member(wedding_id));

CREATE POLICY rsvp_member_delete
  ON public.rsvp
  FOR DELETE
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

CREATE POLICY wishes_member_select
  ON public.wishes
  FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

CREATE POLICY wishes_member_insert
  ON public.wishes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_wedding_member(wedding_id));

CREATE POLICY wishes_member_update
  ON public.wishes
  FOR UPDATE
  TO authenticated
  USING (public.is_wedding_member(wedding_id))
  WITH CHECK (public.is_wedding_member(wedding_id));

CREATE POLICY wishes_member_delete
  ON public.wishes
  FOR DELETE
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

COMMIT;
