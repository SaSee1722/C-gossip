-- Enable the storage extension if not already enabled (usually enabled by default)
-- CREATE EXTENSION IF NOT EXISTS "storage";
-- 1. Avatars Bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
-- Policy: Anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid() = owner
    );
-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar." ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND auth.uid() = owner
    );
-- 2. Chat Media Bucket (Private - authenticated users only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_media', 'chat_media', false) ON CONFLICT (id) DO NOTHING;
-- Policy: Authenticated users can view chat media (Simplification: ideally checked against chat participation)
-- For strict security, you'd use a postgres function to check chat_participants, but for now:
CREATE POLICY "Authenticated users can view chat media." ON storage.objects FOR
SELECT USING (
        bucket_id = 'chat_media'
        AND auth.role() = 'authenticated'
    );
-- Policy: Authenticated users can upload chat media
CREATE POLICY "Authenticated users can upload chat media." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'chat_media'
        AND auth.role() = 'authenticated'
    );
-- 3. Status Updates Bucket (Private/Public depending on requirement, let's go with Private but accessible by friends)
-- For simplicity in this demo, we'll make it authenticated access like chat_media
INSERT INTO storage.buckets (id, name, public)
VALUES ('status_updates', 'status_updates', false) ON CONFLICT (id) DO NOTHING;
-- Policy: Authenticated users can view status updates
CREATE POLICY "Authenticated users can view status updates." ON storage.objects FOR
SELECT USING (
        bucket_id = 'status_updates'
        AND auth.role() = 'authenticated'
    );
-- Policy: Users can upload their own status updates
CREATE POLICY "Users can upload their own status updates." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'status_updates'
        AND auth.role() = 'authenticated'
    );
-- Reminder: You may need to grant usage on schema storage to postgres/anon/authenticated roles if not default.
-- GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, anon, authenticated;