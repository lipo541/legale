-- ============================================
-- Migration: Post Display Settings (Focal Points)
-- Description: Separate table for display settings (focal points for Position 1)
-- Date: 2025-11-15
-- ============================================

-- ============================================
-- 1. CREATE POST_DISPLAY_SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_display_settings (
  -- Primary Key (also FK to posts)
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Focal Point (percentage from top-left corner)
  -- 0 = left/top edge, 50 = center, 100 = right/bottom edge
  focal_point_x INTEGER DEFAULT 50 CHECK (focal_point_x BETWEEN 0 AND 100),
  focal_point_y INTEGER DEFAULT 50 CHECK (focal_point_y BETWEEN 0 AND 100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE post_display_settings IS 'Display settings for posts - focal points for Position 1 image positioning';
COMMENT ON COLUMN post_display_settings.post_id IS 'Foreign key to posts table (primary key)';
COMMENT ON COLUMN post_display_settings.focal_point_x IS 'Horizontal focal point: 0=left edge, 50=center, 100=right edge (used in CSS object-position)';
COMMENT ON COLUMN post_display_settings.focal_point_y IS 'Vertical focal point: 0=top edge, 50=center, 100=bottom edge (used in CSS object-position)';

-- ============================================
-- 3. CREATE INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_post_display_settings_post_id ON post_display_settings(post_id);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE post_display_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Policy: Anyone can view display settings (public read)
CREATE POLICY "Anyone can view post display settings"
ON post_display_settings FOR SELECT
USING (true);

-- Policy: Authenticated users can insert display settings
CREATE POLICY "Authenticated users can insert post display settings"
ON post_display_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update display settings
CREATE POLICY "Authenticated users can update post display settings"
ON post_display_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can delete display settings
CREATE POLICY "Authenticated users can delete post display settings"
ON post_display_settings FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 6. CREATE TRIGGER FOR UPDATED_AT
-- ============================================

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_post_display_settings_updated_at
BEFORE UPDATE ON post_display_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This table stores focal point settings for posts in Position 1
-- Default values (50, 50) = center of image
-- Values are percentages used in CSS: object-position: {x}% {y}%
-- ============================================
