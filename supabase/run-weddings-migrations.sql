-- Commerce P0 consolidated database bootstrap / migration.
-- Run in Supabase Dashboard -> SQL Editor for a fresh or existing Attimo database.
-- Better Auth tables are separate: run `bunx @better-auth/cli migrate` after DATABASE_URL is set.

BEGIN;

CREATE TABLE IF NOT EXISTS weddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'released')),
  template_id TEXT NOT NULL DEFAULT 'classic-001',
  sections JSONB NOT NULL DEFAULT '[]',
  content JSONB NOT NULL DEFAULT '{}',
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE weddings ADD COLUMN IF NOT EXISTS theme JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE weddings ALTER COLUMN template_id SET DEFAULT 'classic-001';
UPDATE weddings SET template_id = 'classic-001' WHERE template_id = 'classic';

CREATE INDEX IF NOT EXISTS idx_weddings_slug ON weddings(slug);
CREATE INDEX IF NOT EXISTS idx_weddings_status ON weddings(status);

CREATE TABLE IF NOT EXISTS wedding_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'collaborator')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wedding_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_wedding_collaborators_user ON wedding_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_collaborators_wedding ON wedding_collaborators(wedding_id);

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

CREATE TABLE IF NOT EXISTS rsvp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('yes', 'no', 'maybe')),
  guest_count INTEGER DEFAULT 0,
  message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE;
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE SET NULL;
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS wishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  location TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE;
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE SET NULL;
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'visible';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishes_status_check') THEN
    ALTER TABLE wishes ADD CONSTRAINT wishes_status_check CHECK (status IN ('visible', 'hidden', 'spam'));
  END IF;
END $$;

-- Remove only legacy rows that never had a tenant/wedding association.
DELETE FROM rsvp WHERE wedding_id IS NULL;
DELETE FROM wishes WHERE wedding_id IS NULL;
ALTER TABLE rsvp ALTER COLUMN wedding_id SET NOT NULL;
ALTER TABLE wishes ALTER COLUMN wedding_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rsvp_wedding_id ON rsvp(wedding_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_wedding_attendance ON rsvp(wedding_id, attendance);
CREATE INDEX IF NOT EXISTS idx_rsvp_guest_id ON rsvp(guest_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rsvp_unique_guest_response ON rsvp(wedding_id, guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wishes_wedding_id ON wishes(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wishes_wedding_status_created ON wishes(wedding_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_guest_id ON wishes(guest_id);

DROP POLICY IF EXISTS "Allow public read access to rsvp" ON rsvp;
DROP POLICY IF EXISTS "Allow public insert access to rsvp" ON rsvp;
DROP POLICY IF EXISTS "Allow public read access to wishes" ON wishes;
DROP POLICY IF EXISTS "Allow public insert wishes" ON wishes;

ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- Intentionally no anon policies: browser clients do not query tenant tables directly.
-- Server routes use SUPABASE_SERVICE_ROLE_KEY and enforce application authorization/scope.

COMMIT;
