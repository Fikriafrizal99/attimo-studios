-- Incremental P0 integrity hardening for databases that already applied 20260905000100.
-- Adds database-level tenant/quota guards and configures the public wedding asset bucket.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rsvp_guest_count_check' AND conrelid = 'rsvp'::regclass
  ) THEN
    ALTER TABLE rsvp ADD CONSTRAINT rsvp_guest_count_check CHECK (guest_count >= 0 AND guest_count <= 20);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_guest_wedding_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.guest_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM guests
    WHERE id = NEW.guest_id
      AND wedding_id = NEW.wedding_id
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'guest_id does not belong to the target wedding or is inactive';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_rsvp_guest_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed_guests INTEGER;
BEGIN
  IF NEW.guest_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT max_guests INTO allowed_guests
  FROM guests
  WHERE id = NEW.guest_id
    AND wedding_id = NEW.wedding_id
    AND is_active = TRUE;

  IF allowed_guests IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'guest quota cannot be resolved for this wedding';
  END IF;

  IF COALESCE(NEW.guest_count, 0) > allowed_guests THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'guest_count exceeds invitation quota';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rsvp_guest_scope ON rsvp;
CREATE TRIGGER trg_rsvp_guest_scope
BEFORE INSERT OR UPDATE OF wedding_id, guest_id ON rsvp
FOR EACH ROW EXECUTE FUNCTION public.enforce_guest_wedding_scope();

DROP TRIGGER IF EXISTS trg_wishes_guest_scope ON wishes;
CREATE TRIGGER trg_wishes_guest_scope
BEFORE INSERT OR UPDATE OF wedding_id, guest_id ON wishes
FOR EACH ROW EXECUTE FUNCTION public.enforce_guest_wedding_scope();

DROP TRIGGER IF EXISTS trg_rsvp_guest_quota ON rsvp;
CREATE TRIGGER trg_rsvp_guest_quota
BEFORE INSERT OR UPDATE OF wedding_id, guest_id, guest_count ON rsvp
FOR EACH ROW EXECUTE FUNCTION public.enforce_rsvp_guest_quota();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'wedding-assets',
      'wedding-assets',
      TRUE,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      public = TRUE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;

COMMIT;
