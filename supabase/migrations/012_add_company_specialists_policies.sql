-- Add RLS policies for companies to manage their specialists

-- Policy: Companies can view their own specialists
CREATE POLICY "Companies can view their specialists"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );

-- Policy: Companies can update their own specialists
CREATE POLICY "Companies can update their specialists"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  )
  WITH CHECK (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );

-- Policy: Companies can delete their own specialists
CREATE POLICY "Companies can delete their specialists"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );
