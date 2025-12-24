-- Update Avatars bucket to be fully public for uploads to avoid auth issues during onboarding
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
-- Drop existing restrictive insert policy if it exists
DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
-- Create a new permissive insert policy allowing anyone (including anon) to upload to avatars
CREATE POLICY "Anyone can upload avatars" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'avatars');
-- Ensure select policy exists
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');