-- Canonical baseline for the legacy RSVP and wishes tables.
-- This migration makes the full supabase/migrations chain reproducible from an empty project.
-- Tenant scoping, guest linkage, moderation, constraints, indexes, and RLS hardening
-- are added by later migrations.

CREATE TABLE IF NOT EXISTS public.rsvp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('yes', 'no', 'maybe')),
  guest_count INTEGER DEFAULT 0,
  message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keep the baseline closed by default. Later migrations retain RLS and explicitly
-- remove legacy public policies before server-mediated commerce access is enabled.
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
