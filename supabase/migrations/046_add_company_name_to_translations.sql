-- Add company_name field to company_translations table
ALTER TABLE company_translations ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_translations_company_name ON company_translations(company_name);
