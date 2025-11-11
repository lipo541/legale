-- URGENT: Manually drop teams tables before running migrations
-- Run this FIRST in Supabase SQL Editor, then run: npx supabase db push

-- Drop all team-related tables
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS team_section_translations CASCADE;
DROP TABLE IF EXISTS team_sections CASCADE;
DROP TABLE IF EXISTS team_translations CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Confirm tables are dropped
SELECT 'Teams tables successfully dropped!' as message;
