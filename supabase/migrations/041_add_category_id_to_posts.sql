-- ============================================
-- ADD CATEGORY_ID TO POSTS TABLE
-- Migration to add category foreign key to main posts table
-- ============================================

-- Step 1: Add category_id column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES post_categories(id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_category_id 
ON posts(category_id);

-- Step 3: Add comment
COMMENT ON COLUMN posts.category_id IS 'Foreign key to post_categories table (optional category for the post)';

-- Step 4: Migrate existing category_id data from post_translations to posts
-- This will use the Georgian translation's category_id as the main category
UPDATE posts p
SET category_id = pt.category_id
FROM post_translations pt
WHERE p.id = pt.post_id 
  AND pt.language = 'ka' 
  AND pt.category_id IS NOT NULL
  AND p.category_id IS NULL;

-- Step 5: Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added category_id column to posts table and migrated data';
END $$;
