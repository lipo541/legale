-- Create storage bucket for company social media images
-- Note: Bucket should be created via Supabase Dashboard → Storage
-- Bucket name: company-social-images
-- Public: Yes

-- Storage policies for company social images
-- These are simplified policies that work with the storage system

-- Allow authenticated users to insert (upload)
DROP POLICY IF EXISTS "Authenticated users can upload company social images" ON storage.objects;
CREATE POLICY "Authenticated users can upload company social images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-social-images');

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Authenticated users can update company social images" ON storage.objects;
CREATE POLICY "Authenticated users can update company social images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-social-images');

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Authenticated users can delete company social images" ON storage.objects;
CREATE POLICY "Authenticated users can delete company social images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-social-images');

-- Allow public to view
DROP POLICY IF EXISTS "Public can view company social images" ON storage.objects;
CREATE POLICY "Public can view company social images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-social-images');
