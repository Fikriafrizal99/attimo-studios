-- Phase 3.7: wedding asset storage isolation.
-- Public invitation assets remain publicly readable, but browser roles must never
-- mutate the wedding-assets bucket directly. All writes go through the server
-- route after Better Auth + tenant membership authorization.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage')
     AND to_regclass('storage.objects') IS NOT NULL THEN
    UPDATE storage.buckets
       SET public = TRUE,
           file_size_limit = 5242880,
           allowed_mime_types = ARRAY[
             'image/jpeg',
             'image/png',
             'image/webp',
             'image/gif'
           ]::text[]
     WHERE id = 'wedding-assets';

    EXECUTE 'DROP POLICY IF EXISTS wedding_assets_block_direct_insert ON storage.objects';
    EXECUTE 'CREATE POLICY wedding_assets_block_direct_insert
               ON storage.objects
               AS RESTRICTIVE
               FOR INSERT
               TO anon, authenticated
               WITH CHECK (bucket_id <> ''wedding-assets'')';

    EXECUTE 'DROP POLICY IF EXISTS wedding_assets_block_direct_update ON storage.objects';
    EXECUTE 'CREATE POLICY wedding_assets_block_direct_update
               ON storage.objects
               AS RESTRICTIVE
               FOR UPDATE
               TO anon, authenticated
               USING (bucket_id <> ''wedding-assets'')
               WITH CHECK (bucket_id <> ''wedding-assets'')';

    EXECUTE 'DROP POLICY IF EXISTS wedding_assets_block_direct_delete ON storage.objects';
    EXECUTE 'CREATE POLICY wedding_assets_block_direct_delete
               ON storage.objects
               AS RESTRICTIVE
               FOR DELETE
               TO anon, authenticated
               USING (bucket_id <> ''wedding-assets'')';
  END IF;
END $$;

COMMIT;
