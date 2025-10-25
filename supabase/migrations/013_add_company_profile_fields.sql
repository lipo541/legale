-- Add extended company profile fields to profiles table

-- Company Overview/Description
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_overview TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS mission_statement TEXT,
ADD COLUMN IF NOT EXISTS vision_values TEXT,
ADD COLUMN IF NOT EXISTS history TEXT,
ADD COLUMN IF NOT EXISTS how_we_work TEXT;

-- Contact Information
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS map_link TEXT;

-- Social Media Links
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS facebook_link TEXT,
ADD COLUMN IF NOT EXISTS instagram_link TEXT,
ADD COLUMN IF NOT EXISTS linkedin_link TEXT,
ADD COLUMN IF NOT EXISTS twitter_link TEXT;

-- Logo
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Comments
COMMENT ON COLUMN profiles.company_overview IS 'Detailed company overview/description';
COMMENT ON COLUMN profiles.summary IS 'Brief introduction shown on public profile';
COMMENT ON COLUMN profiles.mission_statement IS 'Company mission statement';
COMMENT ON COLUMN profiles.vision_values IS 'Company vision and values';
COMMENT ON COLUMN profiles.history IS 'Company history or founding story';
COMMENT ON COLUMN profiles.how_we_work IS 'Description of how the company works';
COMMENT ON COLUMN profiles.website IS 'Company website URL';
COMMENT ON COLUMN profiles.address IS 'Company physical address';
COMMENT ON COLUMN profiles.map_link IS 'Google Maps or similar map link';
COMMENT ON COLUMN profiles.facebook_link IS 'Facebook page URL';
COMMENT ON COLUMN profiles.instagram_link IS 'Instagram profile URL';
COMMENT ON COLUMN profiles.linkedin_link IS 'LinkedIn company page URL';
COMMENT ON COLUMN profiles.twitter_link IS 'Twitter/X profile URL';
COMMENT ON COLUMN profiles.logo_url IS 'Company logo image URL';
