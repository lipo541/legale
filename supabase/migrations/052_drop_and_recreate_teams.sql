-- Migration: Drop and Recreate Teams Tables with Correct Schema
-- Description: Removes old teams tables and recreates with proper structure
-- Author: System
-- Date: 2025-11-11

-- ============================================================================
-- 1. Drop existing tables (if any)
-- ============================================================================
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS team_section_translations CASCADE;
DROP TABLE IF EXISTS team_sections CASCADE;
DROP TABLE IF EXISTS team_translations CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ============================================================================
-- 2. Create teams table (main team information)
-- ============================================================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    og_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_teams_leader_id ON teams(leader_id);
CREATE INDEX idx_teams_is_active ON teams(is_active);

-- Add comment
COMMENT ON TABLE teams IS 'Stores team basic information including leader';

-- ============================================================================
-- 3. Create team_translations table (multilingual team content)
-- ============================================================================
CREATE TABLE team_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    og_title TEXT,
    og_description TEXT,
    banner_image_url TEXT,
    banner_alt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, language),
    UNIQUE(slug, language)
);

-- Add indexes
CREATE INDEX idx_team_translations_team_id ON team_translations(team_id);
CREATE INDEX idx_team_translations_language ON team_translations(language);
CREATE INDEX idx_team_translations_slug ON team_translations(slug);

-- Add comment
COMMENT ON TABLE team_translations IS 'Stores multilingual content for teams (ka, en, ru) including slugs';

-- ============================================================================
-- 4. Create team_sections table (sections within a team)
-- ============================================================================
CREATE TABLE team_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_team_sections_team_id ON team_sections(team_id);
CREATE INDEX idx_team_sections_order ON team_sections("order");

-- Add comment
COMMENT ON TABLE team_sections IS 'Stores sections within a team (e.g., Executive Board, Ethics Committee)';

-- ============================================================================
-- 5. Create team_section_translations table (multilingual section titles)
-- ============================================================================
CREATE TABLE team_section_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES team_sections(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section_id, language)
);

-- Add indexes
CREATE INDEX idx_team_section_translations_section_id ON team_section_translations(section_id);
CREATE INDEX idx_team_section_translations_language ON team_section_translations(language);

-- Add comment
COMMENT ON TABLE team_section_translations IS 'Stores multilingual titles for team sections';

-- ============================================================================
-- 6. Create team_members table (associates specialists with team sections)
-- ============================================================================
CREATE TABLE team_members (
    section_id UUID NOT NULL REFERENCES team_sections(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (section_id, profile_id)
);

-- Add indexes
CREATE INDEX idx_team_members_section_id ON team_members(section_id);
CREATE INDEX idx_team_members_profile_id ON team_members(profile_id);
CREATE INDEX idx_team_members_order ON team_members("order");

-- Add comment
COMMENT ON TABLE team_members IS 'Associates specialists with specific team sections';

-- ============================================================================
-- 7. Add triggers for updated_at columns
-- ============================================================================
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_translations_updated_at
    BEFORE UPDATE ON team_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_sections_updated_at
    BEFORE UPDATE ON team_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_section_translations_updated_at
    BEFORE UPDATE ON team_section_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_section_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Public can view active teams"
    ON teams FOR SELECT
    USING (is_active = true);

CREATE POLICY "Super admins can manage teams"
    ON teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Team translations policies
CREATE POLICY "Public can view team translations"
    ON team_translations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_translations.team_id
            AND teams.is_active = true
        )
    );

CREATE POLICY "Super admins can manage team translations"
    ON team_translations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Team sections policies
CREATE POLICY "Public can view team sections"
    ON team_sections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_sections.team_id
            AND teams.is_active = true
        )
    );

CREATE POLICY "Super admins can manage team sections"
    ON team_sections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Team section translations policies
CREATE POLICY "Public can view team section translations"
    ON team_section_translations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_sections
            JOIN teams ON teams.id = team_sections.team_id
            WHERE team_sections.id = team_section_translations.section_id
            AND teams.is_active = true
        )
    );

CREATE POLICY "Super admins can manage team section translations"
    ON team_section_translations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Team members policies
CREATE POLICY "Public can view team members"
    ON team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_sections
            JOIN teams ON teams.id = team_sections.team_id
            WHERE team_sections.id = team_members.section_id
            AND teams.is_active = true
        )
    );

CREATE POLICY "Super admins can manage team members"
    ON team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- ============================================================================
-- 9. Grant permissions
-- ============================================================================
GRANT SELECT ON teams TO anon, authenticated;
GRANT SELECT ON team_translations TO anon, authenticated;
GRANT SELECT ON team_sections TO anon, authenticated;
GRANT SELECT ON team_section_translations TO anon, authenticated;
GRANT SELECT ON team_members TO anon, authenticated;

GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_translations TO authenticated;
GRANT ALL ON team_sections TO authenticated;
GRANT ALL ON team_section_translations TO authenticated;
GRANT ALL ON team_members TO authenticated;
