-- Add public read access to team_translations and related tables
-- This allows anonymous users to view team information on the website

-- Public read access to team_translations
CREATE POLICY "Public read access for team translations"
ON team_translations FOR SELECT
TO anon, authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE is_active = true
  )
);

-- Public read access to teams (only active teams)
CREATE POLICY "Public read access for active teams"
ON teams FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Public read access to team_sections
CREATE POLICY "Public read access for team sections"
ON team_sections FOR SELECT
TO anon, authenticated
USING (
  team_id IN (
    SELECT id FROM teams WHERE is_active = true
  )
);

-- Public read access to team_section_translations
CREATE POLICY "Public read access for team section translations"
ON team_section_translations FOR SELECT
TO anon, authenticated
USING (
  section_id IN (
    SELECT id FROM team_sections 
    WHERE team_id IN (
      SELECT id FROM teams WHERE is_active = true
    )
  )
);

-- Public read access to team_members
CREATE POLICY "Public read access for team members"
ON team_members FOR SELECT
TO anon, authenticated
USING (
  section_id IN (
    SELECT id FROM team_sections 
    WHERE team_id IN (
      SELECT id FROM teams WHERE is_active = true
    )
  )
);
