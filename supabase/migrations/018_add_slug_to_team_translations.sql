-- Migration: Add slug column to team_translations
-- Description: Adds missing slug column to team_translations table
-- Author: System
-- Date: 2025-11-11

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team_translations' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE team_translations 
        ADD COLUMN slug TEXT NOT NULL DEFAULT '';
        
        -- Add unique constraint
        ALTER TABLE team_translations 
        ADD CONSTRAINT team_translations_slug_language_unique UNIQUE(slug, language);
        
        -- Add index
        CREATE INDEX idx_team_translations_slug ON team_translations(slug);
    END IF;
END $$;

-- Add banner_image_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team_translations' 
        AND column_name = 'banner_image_url'
    ) THEN
        ALTER TABLE team_translations 
        ADD COLUMN banner_image_url TEXT;
    END IF;
END $$;

-- Add banner_alt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team_translations' 
        AND column_name = 'banner_alt'
    ) THEN
        ALTER TABLE team_translations 
        ADD COLUMN banner_alt TEXT;
    END IF;
END $$;
