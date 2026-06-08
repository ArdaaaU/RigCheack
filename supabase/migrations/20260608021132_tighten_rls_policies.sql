/*
# Tighten RLS Policies

## Summary
Restricts write access to reduce security exposure flagged by the RLS scanner.
All USING (true) / WITH CHECK (true) policies on anon are replaced with
intentional, documented policies appropriate for a single-tenant public app.

## Changes per table

### components (reference data)
- anon: SELECT only — no writes from the frontend needed
- authenticated: full CRUD (for admin/service role use)

### builds, benchmarks, support_threads, support_messages (user-generated content)
- anon: SELECT + INSERT allowed (public community submissions)
- UPDATE + DELETE: restricted to `authenticated` role only
  This prevents anonymous users from modifying or deleting records they didn't create.

## Security Notes
- USING (true) on SELECT is intentional: data is public/shared by design (no user auth).
- WITH CHECK (true) on INSERT is intentional: anonymous community submissions are allowed.
- UPDATE/DELETE for anon are removed to prevent unauthenticated vandalism.
*/

-- ============================================================
-- components: SELECT-only for anon, full access for authenticated
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_components"  ON components;
DROP POLICY IF EXISTS "anon_update_components"  ON components;
DROP POLICY IF EXISTS "anon_delete_components"  ON components;

-- Keep anon SELECT (reference data must be readable)
DROP POLICY IF EXISTS "anon_select_components" ON components;
CREATE POLICY "anon_select_components" ON components
  FOR SELECT TO anon, authenticated USING (true);

-- Authenticated-only writes (service role / admin)
DROP POLICY IF EXISTS "auth_insert_components" ON components;
CREATE POLICY "auth_insert_components" ON components
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_components" ON components;
CREATE POLICY "auth_update_components" ON components
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_components" ON components;
CREATE POLICY "auth_delete_components" ON components
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- builds: anon SELECT + INSERT; authenticated-only UPDATE/DELETE
-- ============================================================
DROP POLICY IF EXISTS "anon_update_builds" ON builds;
DROP POLICY IF EXISTS "anon_delete_builds" ON builds;

DROP POLICY IF EXISTS "anon_select_builds" ON builds;
CREATE POLICY "anon_select_builds" ON builds
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_builds" ON builds;
CREATE POLICY "anon_insert_builds" ON builds
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_builds" ON builds;
CREATE POLICY "auth_update_builds" ON builds
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_builds" ON builds;
CREATE POLICY "auth_delete_builds" ON builds
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- support_threads: anon SELECT + INSERT; authenticated-only UPDATE/DELETE
-- ============================================================
DROP POLICY IF EXISTS "anon_update_threads" ON support_threads;
DROP POLICY IF EXISTS "anon_delete_threads" ON support_threads;

DROP POLICY IF EXISTS "anon_select_threads" ON support_threads;
CREATE POLICY "anon_select_threads" ON support_threads
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_threads" ON support_threads;
CREATE POLICY "anon_insert_threads" ON support_threads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_threads" ON support_threads;
CREATE POLICY "auth_update_threads" ON support_threads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_threads" ON support_threads;
CREATE POLICY "auth_delete_threads" ON support_threads
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- support_messages: anon SELECT + INSERT; authenticated-only UPDATE/DELETE
-- ============================================================
DROP POLICY IF EXISTS "anon_update_messages" ON support_messages;
DROP POLICY IF EXISTS "anon_delete_messages" ON support_messages;

DROP POLICY IF EXISTS "anon_select_messages" ON support_messages;
CREATE POLICY "anon_select_messages" ON support_messages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON support_messages;
CREATE POLICY "anon_insert_messages" ON support_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_messages" ON support_messages;
CREATE POLICY "auth_update_messages" ON support_messages
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_messages" ON support_messages;
CREATE POLICY "auth_delete_messages" ON support_messages
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- benchmarks: anon SELECT + INSERT; authenticated-only UPDATE/DELETE
-- ============================================================
DROP POLICY IF EXISTS "anon_update_benchmarks" ON benchmarks;
DROP POLICY IF EXISTS "anon_delete_benchmarks" ON benchmarks;

DROP POLICY IF EXISTS "anon_select_benchmarks" ON benchmarks;
CREATE POLICY "anon_select_benchmarks" ON benchmarks
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_benchmarks" ON benchmarks;
CREATE POLICY "anon_insert_benchmarks" ON benchmarks
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_benchmarks" ON benchmarks;
CREATE POLICY "auth_update_benchmarks" ON benchmarks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_benchmarks" ON benchmarks;
CREATE POLICY "auth_delete_benchmarks" ON benchmarks
  FOR DELETE TO authenticated USING (true);
