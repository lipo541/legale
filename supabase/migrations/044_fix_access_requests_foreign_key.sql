-- Fix foreign key constraints in access_requests table
-- This allows deleting profiles (companies/reviewers) without cascade errors
-- Fields will be set to NULL to preserve request history

-- 1. Fix reviewed_by foreign key
ALTER TABLE access_requests 
DROP CONSTRAINT IF EXISTS access_requests_reviewed_by_fkey;

ALTER TABLE access_requests 
ADD CONSTRAINT access_requests_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- 2. Fix company_id foreign key
ALTER TABLE access_requests 
DROP CONSTRAINT IF EXISTS access_requests_company_id_fkey;

ALTER TABLE access_requests 
ADD CONSTRAINT access_requests_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON CONSTRAINT access_requests_reviewed_by_fkey ON access_requests 
IS 'Foreign key with SET NULL on delete - preserves request history when reviewer is deleted';

COMMENT ON CONSTRAINT access_requests_company_id_fkey ON access_requests 
IS 'Foreign key with SET NULL on delete - preserves request history when company is deleted';
