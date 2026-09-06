-- Phase 1.6: tenant-aware database boundary for Better Auth dashboard access.
-- Dashboard queries run as PostgreSQL role `authenticated` inside a transaction
-- with app.better_auth_user_id set. Narrow SECURITY DEFINER helpers live in the
-- private schema for operations that need elevated database scope.

BEGIN;

CREATE OR REPLACE FUNCTION app_private.create_wedding_for_current_user(
  p_template_id TEXT,
  p_sections JSONB,
  p_content JSONB,
  p_theme JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor_user_id TEXT;
  new_wedding public.weddings%ROWTYPE;
BEGIN
  actor_user_id := app_private.current_better_auth_user_id();
  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Better Auth identity is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."user" WHERE id = actor_user_id) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'owner user does not exist';
  END IF;

  INSERT INTO public.weddings (
    status,
    template_id,
    sections,
    content,
    theme
  )
  VALUES (
    'draft',
    p_template_id,
    COALESCE(p_sections, '[]'::jsonb),
    COALESCE(p_content, '{}'::jsonb),
    COALESCE(p_theme, '{}'::jsonb)
  )
  RETURNING * INTO new_wedding;

  INSERT INTO public.wedding_collaborators (wedding_id, user_id, role)
  VALUES (new_wedding.id, actor_user_id, 'owner');

  RETURN jsonb_build_object(
    'id', new_wedding.id,
    'slug', new_wedding.slug,
    'template_id', new_wedding.template_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION app_private.is_wedding_slug_available(
  p_slug TEXT,
  p_exclude_wedding_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor_user_id TEXT;
BEGIN
  actor_user_id := app_private.current_better_auth_user_id();
  IF actor_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Better Auth identity is required';
  END IF;

  IF p_exclude_wedding_id IS NOT NULL
     AND NOT app_private.is_wedding_owner(p_exclude_wedding_id) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'only the wedding owner may check settings slug availability';
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.weddings w
    WHERE w.slug = p_slug
      AND (p_exclude_wedding_id IS NULL OR w.id <> p_exclude_wedding_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION app_private.create_wedding_for_current_user(TEXT, JSONB, JSONB, JSONB)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.is_wedding_slug_available(TEXT, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.create_wedding_for_current_user(TEXT, JSONB, JSONB, JSONB)
  TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_wedding_slug_available(TEXT, UUID)
  TO authenticated;

COMMIT;
