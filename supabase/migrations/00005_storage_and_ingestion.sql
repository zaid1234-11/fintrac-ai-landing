-- Migration 00005: Supabase Storage for Financial Ingestion

-- 1. Create 'bank-statements' bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bank-statements', 
    'bank-statements', 
    false, -- Keep it private
    10485760, -- 10MB limit (10 * 1024 * 1024)
    ARRAY['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE 
SET 
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- 2. Enable Storage RLS (it is enabled by default, but make sure)
DROP POLICY IF EXISTS "Allow users to upload statements to their own folder" ON storage.objects;
CREATE POLICY "Allow users to upload statements to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'bank-statements' AND
    (auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Allow users to view statements in their own folder" ON storage.objects;
CREATE POLICY "Allow users to view statements in their own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'bank-statements' AND
    (auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Allow users to update statements in their own folder" ON storage.objects;
CREATE POLICY "Allow users to update statements in their own folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'bank-statements' AND
    (auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Allow users to delete statements in their own folder" ON storage.objects;
CREATE POLICY "Allow users to delete statements in their own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'bank-statements' AND
    (auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
);
