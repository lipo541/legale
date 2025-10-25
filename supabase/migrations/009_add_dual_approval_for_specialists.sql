-- Add fields for company-specialist join requests
-- Company and Admin have EQUAL rights: either can approve or reject independently

-- Add company_id to track which company a specialist wants to join
ALTER TABLE access_requests
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES profiles(id);

-- Add index for company_id
CREATE INDEX IF NOT EXISTS idx_access_requests_company_id ON access_requests(company_id);

-- Add RLS policy: Companies can view requests for joining their company
CREATE POLICY "Companies can view join requests"
  ON access_requests
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  );

-- Add RLS policy: Companies can update requests for joining their company (approve/reject)
CREATE POLICY "Companies can update join requests"
  ON access_requests
  FOR UPDATE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  )
  WITH CHECK (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  );

-- Add comments
COMMENT ON COLUMN access_requests.company_id IS 'Company that specialist wants to join (null for solo specialists or company registrations)';
