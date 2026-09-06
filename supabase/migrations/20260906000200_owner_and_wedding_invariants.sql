-- Phase 1.3: database constraints and invariants.
-- Enforces exactly one owner per wedding, valid Better Auth membership,
-- basic slug/release metadata integrity, and atomic wedding creation.

BEGIN;

-- Existing rows must already be clean before these constraints are installed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.weddings w
    LEFT JOIN public.wedding_collaborators wc
      ON wc.wedding_id = w.id AND wc.role = 'owner'
    GROUP BY w.id
    HAVING COUNT(wc.id) <> 1
  ) THEN
    RAISE EXCEPTION 'cannot install ownership invariants: every wedding must have exactly one owner';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.wedding_collaborators wc
    LEFT JOIN public."user" u ON u.id = wc.user_id
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'cannot install ownership invariants: orphan collaborator user_id exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.weddings
    WHERE slug IS NOT NULL
      AND (
        char_length(slug) < 2
        OR char_length(slug) > 63
        OR slug !~ '^[a-z0-9-]+$'
      )
  ) THEN
    RAISE EXCEPTION 'cannot install wedding invariants: invalid existing slug exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.weddings
    WHERE status = 'released'
      AND (slug IS NULL OR published_at IS NULL)
  ) THEN
    RAISE EXCEPTION 'cannot install wedding invariants: released wedding is missing slug or published_at';
  END IF;
END $$;

-- A collaborator must always map to a real Better Auth user.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wedding_collaborators_user_id_fkey'
      AND conrelid = 'public.wedding_collaborators'::regclass
  ) THEN
    ALTER TABLE public.wedding_collaborators
      ADD CONSTRAINT wedding_collaborators_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public."user"(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- At most one owner can exist for a wedding. The deferred triggers below
-- enforce the complementary "at least one" side at transaction commit.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wedding_collaborators_one_owner
  ON public.wedding_collaborators (wedding_id)
  WHERE role = 'owner';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'weddings_slug_shape_check'
      AND conrelid = 'public.weddings'::regclass
  ) THEN
    ALTER TABLE public.weddings
      ADD CONSTRAINT weddings_slug_shape_check
      CHECK (
        slug IS NULL OR (
          char_length(slug) BETWEEN 2 AND 63
          AND slug ~ '^[a-z0-9-]+$'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'weddings_released_metadata_check'
      AND conrelid = 'public.weddings'::regclass
  ) THEN
    ALTER TABLE public.weddings
      ADD CONSTRAINT weddings_released_metadata_check
      CHECK (
        status <> 'released'
        OR (slug IS NOT NULL AND published_at IS NOT NULL)
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.assert_wedding_exactly_one_owner(p_wedding_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  -- Cascading deletes of an entire wedding are valid; once the wedding no
  -- longer exists there is no ownership invariant left to enforce.
  IF NOT EXISTS (SELECT 1 FROM public.weddings WHERE id = p_wedding_id) THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO owner_count
  FROM public.wedding_collaborators
  WHERE wedding_id = p_wedding_id
    AND role = 'owner';

  IF owner_count <> 1 THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = format('wedding %s must have exactly one owner', p_wedding_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_wedding_owner_after_wedding_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.assert_wedding_exactly_one_owner(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_wedding_owner_after_membership_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.assert_wedding_exactly_one_owner(OLD.wedding_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.wedding_id IS DISTINCT FROM NEW.wedding_id THEN
    PERFORM public.assert_wedding_exactly_one_owner(OLD.wedding_id);
  END IF;

  PERFORM public.assert_wedding_exactly_one_owner(NEW.wedding_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wedding_requires_owner ON public.weddings;
CREATE CONSTRAINT TRIGGER trg_wedding_requires_owner
AFTER INSERT ON public.weddings
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.check_wedding_owner_after_wedding_insert();

DROP TRIGGER IF EXISTS trg_wedding_membership_preserves_owner ON public.wedding_collaborators;
CREATE CONSTRAINT TRIGGER trg_wedding_membership_preserves_owner
AFTER INSERT OR UPDATE OR DELETE ON public.wedding_collaborators
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.check_wedding_owner_after_membership_change();

-- Wedding creation must happen in one database transaction so the deferred
-- exactly-one-owner constraint can be satisfied atomically.
CREATE OR REPLACE FUNCTION public.create_wedding_with_owner(
  p_owner_user_id TEXT,
  p_template_id TEXT,
  p_sections JSONB,
  p_content JSONB,
  p_theme JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_wedding public.weddings%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public."user" WHERE id = p_owner_user_id) THEN
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
  VALUES (new_wedding.id, p_owner_user_id, 'owner');

  RETURN jsonb_build_object(
    'id', new_wedding.id,
    'slug', new_wedding.slug,
    'template_id', new_wedding.template_id
  );
END;
$$;

-- These helper/RPC functions must not become public PostgREST capabilities.
REVOKE ALL ON FUNCTION public.assert_wedding_exactly_one_owner(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_wedding_owner_after_wedding_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_wedding_owner_after_membership_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_wedding_with_owner(TEXT, TEXT, JSONB, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_wedding_with_owner(TEXT, TEXT, JSONB, JSONB, JSONB) TO service_role;

COMMIT;
