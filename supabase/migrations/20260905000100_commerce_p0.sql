-- Commerce Foundation P0 migration
-- Date: 2026-09-05
-- Purpose: tenant isolation, guest personalization, moderation, publish metadata,
-- and migration from legacy `classic` renderer ID to the template registry.

BEGIN;

ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE weddings ALTER COLUMN template_id SET DEFAULT 'classic-001';
UPDATE weddings SET template_id = 'classic-001' WHERE template_id = 'classic';

CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT,
  group_name TEXT,
  max_guests INTEGER NOT NULL DEFAULT 1 CHECK (max_guests >= 1 AND max_guests <= 20),
  token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (wedding_id, token)
);

CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_active ON guests(wedding_id, is_active);

ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE SET NULL;
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE SET NULL;
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'visible';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wishes_status_check'
  ) THEN
    ALTER TABLE wishes
      ADD CONSTRAINT wishes_status_check CHECK (status IN ('visible', 'hidden', 'spam'));
  END IF;
END $$;

-- Legacy unscoped demo rows cannot safely exist in a multi-tenant product.
DELETE FROM rsvp WHERE wedding_id IS NULL;
DELETE FROM wishes WHERE wedding_id IS NULL;

ALTER TABLE rsvp ALTER COLUMN wedding_id SET NOT NULL;
ALTER TABLE wishes ALTER COLUMN wedding_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rsvp_wedding_attendance ON rsvp(wedding_id, attendance);
CREATE INDEX IF NOT EXISTS idx_rsvp_guest_id ON rsvp(guest_id);
CREATE INDEX IF NOT EXISTS idx_wishes_wedding_status_created ON wishes(wedding_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_guest_id ON wishes(guest_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rsvp_unique_guest_response
  ON rsvp(wedding_id, guest_id)
  WHERE guest_id IS NOT NULL;

DROP POLICY IF EXISTS "Allow public read access to rsvp" ON rsvp;
DROP POLICY IF EXISTS "Allow public insert access to rsvp" ON rsvp;
DROP POLICY IF EXISTS "Allow public read access to wishes" ON wishes;
DROP POLICY IF EXISTS "Allow public insert wishes" ON wishes;

ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_collaborators ENABLE ROW LEVEL SECURITY;

-- No anon policies are intentionally added. Public/admin requests use server routes
-- with an explicit server-only service-role client and application authorization.

COMMIT;
