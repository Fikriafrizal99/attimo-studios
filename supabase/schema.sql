-- Safe legacy bootstrap for RSVP/wishes only.
-- Commerce P0 canonical setup is `supabase/run-weddings-migrations.sql`.
-- This file intentionally creates NO public read/write policies.

CREATE TABLE IF NOT EXISTS rsvp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('yes', 'no', 'maybe')),
  guest_count INTEGER DEFAULT 0,
  message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rsvp_submitted_at ON rsvp(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvp_attendance ON rsvp(attendance);

ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to rsvp" ON rsvp;
DROP POLICY IF EXISTS "Allow public insert access to rsvp" ON rsvp;
DROP POLICY IF EXISTS "Allow public read access to wishes" ON wishes;
DROP POLICY IF EXISTS "Allow public insert wishes" ON wishes;
