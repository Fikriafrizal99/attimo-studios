# ENDRIYA Wedding Asset Isolation

Status: Phase 3.7

## Boundary

Wedding assets live in the Supabase Storage bucket `wedding-assets` and use a server-generated object namespace:

```text
weddings/<wedding_id>/assets/<timestamp>-<random-token>.<extension>
```

The browser never supplies the storage object path.

## Write flow

1. Better Auth session is required.
2. The server validates that `wedding_id` is a UUID.
3. `withTenantDb()` establishes the Better Auth tenant database context.
4. The server confirms the current user is an owner or collaborator of that wedding.
5. The server validates image size and inspects the actual file signature.
6. The declared MIME type must match the detected JPEG/PNG/WebP/GIF content.
7. The server generates the wedding-scoped object path.
8. Only then is the narrowly-scoped service-role Storage upload executed.

The service-role key remains server-only and must never be exposed to the browser.

## Direct Storage writes

`storage.objects` uses RLS. Phase 3.7 adds RESTRICTIVE mutation policies for `anon` and `authenticated` that deny INSERT, UPDATE, and DELETE when `bucket_id = 'wedding-assets'`.

This is deliberate even though the app already performs writes through the server. The restrictive policies prevent a future permissive Storage policy from accidentally opening direct browser mutation for this bucket.

Public invitation assets remain publicly readable because the bucket is intentionally public. Public read access is not permission to mutate an object.

## Limits

- Maximum object size: 5 MiB.
- Allowed image formats: JPEG, PNG, WebP, GIF.
- File extension is derived from detected content, not the original filename.
- `upsert` is disabled; uploaded object names are random and immutable by default.

## Tenant invariant

A wedding member can cause the server to create an object only under their wedding namespace. A request for another wedding fails membership authorization before the service-role client is created.

No renderer or template owns its own asset bucket. 2D, 2.5D, and 3D templates consume URLs stored in the same canonical Wedding Content Contract.
