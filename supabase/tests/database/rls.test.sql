BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = extensions, public;

SELECT plan(30);

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.users'::regclass), 'users has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.users', 'SELECT') AND NOT has_table_privilege('anon', 'public.users', 'INSERT') AND NOT has_table_privilege('anon', 'public.users', 'UPDATE') AND NOT has_table_privilege('anon', 'public.users', 'DELETE'), 'anon cannot access users');
SELECT ok(NOT has_table_privilege('authenticated', 'public.users', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.users', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.users', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.users', 'DELETE'), 'authenticated cannot access users');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.owner_submissions'::regclass), 'owner_submissions has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.owner_submissions', 'SELECT') AND NOT has_table_privilege('anon', 'public.owner_submissions', 'INSERT') AND NOT has_table_privilege('anon', 'public.owner_submissions', 'UPDATE') AND NOT has_table_privilege('anon', 'public.owner_submissions', 'DELETE'), 'anon cannot access owner_submissions');
SELECT ok(NOT has_table_privilege('authenticated', 'public.owner_submissions', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.owner_submissions', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.owner_submissions', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.owner_submissions', 'DELETE'), 'authenticated cannot access owner_submissions');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.room_images'::regclass), 'room_images has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.room_images', 'SELECT') AND NOT has_table_privilege('anon', 'public.room_images', 'INSERT') AND NOT has_table_privilege('anon', 'public.room_images', 'UPDATE') AND NOT has_table_privilege('anon', 'public.room_images', 'DELETE'), 'anon cannot access room_images');
SELECT ok(NOT has_table_privilege('authenticated', 'public.room_images', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.room_images', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.room_images', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.room_images', 'DELETE'), 'authenticated cannot access room_images');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.renter_requests'::regclass), 'renter_requests has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.renter_requests', 'SELECT') AND NOT has_table_privilege('anon', 'public.renter_requests', 'INSERT') AND NOT has_table_privilege('anon', 'public.renter_requests', 'UPDATE') AND NOT has_table_privilege('anon', 'public.renter_requests', 'DELETE'), 'anon cannot access renter_requests');
SELECT ok(NOT has_table_privilege('authenticated', 'public.renter_requests', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.renter_requests', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.renter_requests', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.renter_requests', 'DELETE'), 'authenticated cannot access renter_requests');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.saved_rooms'::regclass), 'saved_rooms has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.saved_rooms', 'SELECT') AND NOT has_table_privilege('anon', 'public.saved_rooms', 'INSERT') AND NOT has_table_privilege('anon', 'public.saved_rooms', 'UPDATE') AND NOT has_table_privilege('anon', 'public.saved_rooms', 'DELETE'), 'anon cannot access saved_rooms');
SELECT ok(NOT has_table_privilege('authenticated', 'public.saved_rooms', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.saved_rooms', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.saved_rooms', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.saved_rooms', 'DELETE'), 'authenticated cannot access saved_rooms');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.areas'::regclass), 'areas has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.areas', 'SELECT') AND NOT has_table_privilege('anon', 'public.areas', 'INSERT') AND NOT has_table_privilege('anon', 'public.areas', 'UPDATE') AND NOT has_table_privilege('anon', 'public.areas', 'DELETE'), 'anon cannot access areas');
SELECT ok(NOT has_table_privilege('authenticated', 'public.areas', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.areas', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.areas', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.areas', 'DELETE'), 'authenticated cannot access areas');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.rate_limits'::regclass), 'rate_limits has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.rate_limits', 'SELECT') AND NOT has_table_privilege('anon', 'public.rate_limits', 'INSERT') AND NOT has_table_privilege('anon', 'public.rate_limits', 'UPDATE') AND NOT has_table_privilege('anon', 'public.rate_limits', 'DELETE'), 'anon cannot access rate_limits');
SELECT ok(NOT has_table_privilege('authenticated', 'public.rate_limits', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.rate_limits', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.rate_limits', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.rate_limits', 'DELETE'), 'authenticated cannot access rate_limits');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.user_sessions'::regclass), 'user_sessions has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.user_sessions', 'SELECT') AND NOT has_table_privilege('anon', 'public.user_sessions', 'INSERT') AND NOT has_table_privilege('anon', 'public.user_sessions', 'UPDATE') AND NOT has_table_privilege('anon', 'public.user_sessions', 'DELETE'), 'anon cannot access user_sessions');
SELECT ok(NOT has_table_privilege('authenticated', 'public.user_sessions', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.user_sessions', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.user_sessions', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.user_sessions', 'DELETE'), 'authenticated cannot access user_sessions');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.password_resets'::regclass), 'password_resets has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.password_resets', 'SELECT') AND NOT has_table_privilege('anon', 'public.password_resets', 'INSERT') AND NOT has_table_privilege('anon', 'public.password_resets', 'UPDATE') AND NOT has_table_privilege('anon', 'public.password_resets', 'DELETE'), 'anon cannot access password_resets');
SELECT ok(NOT has_table_privilege('authenticated', 'public.password_resets', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.password_resets', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.password_resets', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.password_resets', 'DELETE'), 'authenticated cannot access password_resets');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.user_auth_identities'::regclass), 'user_auth_identities has RLS enabled');
SELECT ok(NOT has_table_privilege('anon', 'public.user_auth_identities', 'SELECT') AND NOT has_table_privilege('anon', 'public.user_auth_identities', 'INSERT') AND NOT has_table_privilege('anon', 'public.user_auth_identities', 'UPDATE') AND NOT has_table_privilege('anon', 'public.user_auth_identities', 'DELETE'), 'anon cannot access user_auth_identities');
SELECT ok(NOT has_table_privilege('authenticated', 'public.user_auth_identities', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.user_auth_identities', 'INSERT') AND NOT has_table_privilege('authenticated', 'public.user_auth_identities', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.user_auth_identities', 'DELETE'), 'authenticated cannot access user_auth_identities');

SELECT * FROM finish();
ROLLBACK;
