-- Migration: Create subscribers table for Patreon subscriber management
-- Created: 2025-12-15
-- Description: Sets up the subscribers table with RLS policies for secure subscriber tracking

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger to subscribers table
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access for webhook operations)
DROP POLICY IF EXISTS "Service role has full access" ON subscribers;
CREATE POLICY "Service role has full access"
  ON subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: Anon role access is intentionally NOT granted for MVP
-- All subscriber verification will be done server-side
-- To add anon read access later if needed:
-- CREATE POLICY "Anon can read subscribers"
--   ON subscribers
--   FOR SELECT
--   TO anon
--   USING (true);

-- Add helpful comments to table and columns
COMMENT ON TABLE subscribers IS 'Stores Patreon subscriber information for access control';
COMMENT ON COLUMN subscribers.id IS 'Unique identifier for the subscriber record';
COMMENT ON COLUMN subscribers.email IS 'Subscriber email address (normalized to lowercase)';
COMMENT ON COLUMN subscribers.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN subscribers.created_at IS 'Timestamp when subscriber was first added';
COMMENT ON COLUMN subscribers.updated_at IS 'Timestamp when subscriber record was last modified';
