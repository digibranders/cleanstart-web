-- src/db/rls.sql. Run as portal_owner. Idempotent.

-- ---------------------------------------------------------------- identity helpers
CREATE OR REPLACE FUNCTION app_kind() RETURNS text LANGUAGE sql STABLE AS
$$ SELECT coalesce(nullif(current_setting('app.kind', true), ''), 'none') $$;

CREATE OR REPLACE FUNCTION app_partner_id() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.partner_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_user_id() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_is_system() RETURNS boolean LANGUAGE sql STABLE AS
$$ SELECT app_kind() = 'system' $$;

CREATE OR REPLACE FUNCTION app_is_staff() RETURNS boolean LANGUAGE sql STABLE AS
$$ SELECT app_kind() IN ('staff', 'system') $$;

-- ---------------------------------------------------------------- triggers
CREATE OR REPLACE FUNCTION portal_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS
$$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- Child tables copy partner_id from the parent registration, so an insert that forgets it (or lies) is corrected.
CREATE OR REPLACE FUNCTION portal_child_partner_id() RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
  NEW.partner_id := (SELECT r.partner_id FROM registrations r WHERE r.id = NEW.registration_id);
  IF NEW.partner_id IS NULL THEN
    RAISE EXCEPTION 'registration % not found or not visible', NEW.registration_id USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION portal_audit_immutable() RETURNS trigger LANGUAGE plpgsql AS
$$ BEGIN RAISE EXCEPTION 'audit_log is append only' USING ERRCODE = 'insufficient_privilege'; END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables tb ON tb.table_name = c.table_name AND tb.table_schema = c.table_schema
    WHERE c.table_schema = 'public' AND c.column_name = 'updated_at' AND tb.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS touch_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION portal_touch_updated_at()', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['registration_contacts', 'registration_messages', 'registration_events'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS child_partner_id ON %I', t);
    EXECUTE format('CREATE TRIGGER child_partner_id BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION portal_child_partner_id()', t);
  END LOOP;
END
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION portal_audit_immutable();

-- ---------------------------------------------------------------- row level security on, forced for the owner too
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'regions', 'partners', 'users', 'staff_scopes', 'partner_checklist', 'applications', 'application_notes', 'application_tokens', 'invites', 'access_requests',
    'registrations', 'registration_contacts', 'registration_messages', 'registration_events', 'registration_reminders',
    'documents', 'document_audience', 'document_versions', 'document_opens', 'material_requests', 'email_change_requests',
    'notifications', 'notification_prefs', 'audit_log', 'hubspot_outbox', 'hubspot_sync_state',
    'auth_session', 'auth_account', 'auth_verification', 'auth_two_factor'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------- partner scoped tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'registrations', 'registration_contacts', 'registration_messages', 'registration_events',
    'document_opens', 'access_requests', 'partner_checklist', 'email_change_requests'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_delete', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (app_is_staff() OR partner_id = app_partner_id())', t || '_select', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (app_is_staff() OR partner_id = app_partner_id())', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (app_is_staff() OR partner_id = app_partner_id()) WITH CHECK (app_is_staff() OR partner_id = app_partner_id())', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (app_is_system())', t || '_delete', t);
  END LOOP;
END
$$;

-- An undo of a decision (M2.2 undoDecision, runs as a staff viewer) deletes the automatic event and thread line it
-- wrote. DELETE is already granted to portal_app on both tables; a partner viewer still cannot delete either.
DROP POLICY IF EXISTS registration_events_delete ON registration_events;
CREATE POLICY registration_events_delete ON registration_events FOR DELETE USING (app_is_staff());
DROP POLICY IF EXISTS registration_messages_delete ON registration_messages;
CREATE POLICY registration_messages_delete ON registration_messages FOR DELETE USING (app_is_staff());

-- A partner removes a contact only while the registration is still pending (B4); once accepted the manager owns the contacts.
DROP POLICY IF EXISTS registration_contacts_delete ON registration_contacts;
CREATE POLICY registration_contacts_delete ON registration_contacts FOR DELETE USING (
  app_is_system()
  OR (
    partner_id = app_partner_id()
    AND EXISTS (SELECT 1 FROM registrations r WHERE r.id = registration_contacts.registration_id AND r.status = 'pending')
  )
);

-- ---------------------------------------------------------------- partners
DROP POLICY IF EXISTS partners_select ON partners;
DROP POLICY IF EXISTS partners_insert ON partners;
DROP POLICY IF EXISTS partners_update ON partners;
CREATE POLICY partners_select ON partners FOR SELECT USING (app_is_staff() OR id = app_partner_id());
CREATE POLICY partners_insert ON partners FOR INSERT WITH CHECK (app_is_staff());
CREATE POLICY partners_update ON partners FOR UPDATE
  USING (app_is_staff() OR id = app_partner_id()) WITH CHECK (app_is_staff() OR id = app_partner_id());

-- ---------------------------------------------------------------- users
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_insert ON users;
DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_select ON users FOR SELECT USING (
  app_is_staff()
  OR id = app_user_id()
  OR (partner_id IS NOT NULL AND partner_id = app_partner_id())
  OR id = (SELECT p.manager_id FROM partners p WHERE p.id = app_partner_id())
  OR (kind = 'staff' AND role = 'partner_manager' AND status = 'active')
);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (app_is_staff() OR (partner_id IS NOT NULL AND partner_id = app_partner_id()));
CREATE POLICY users_update ON users FOR UPDATE
  USING (app_is_staff() OR id = app_user_id() OR (partner_id IS NOT NULL AND partner_id = app_partner_id()))
  WITH CHECK (app_is_staff() OR id = app_user_id() OR (partner_id IS NOT NULL AND partner_id = app_partner_id()));

-- ---------------------------------------------------------------- invites
DROP POLICY IF EXISTS invites_select ON invites;
DROP POLICY IF EXISTS invites_insert ON invites;
DROP POLICY IF EXISTS invites_update ON invites;
CREATE POLICY invites_select ON invites FOR SELECT USING (app_is_staff() OR (partner_id IS NOT NULL AND partner_id = app_partner_id()));
CREATE POLICY invites_insert ON invites FOR INSERT WITH CHECK (app_is_staff() OR (partner_id IS NOT NULL AND partner_id = app_partner_id()));
CREATE POLICY invites_update ON invites FOR UPDATE
  USING (app_is_staff() OR (partner_id IS NOT NULL AND partner_id = app_partner_id()))
  WITH CHECK (app_is_staff() OR (partner_id IS NOT NULL AND partner_id = app_partner_id()));

-- ---------------------------------------------------------------- documents (audience rule; keep in step with src/server/files/rules.ts)
DROP POLICY IF EXISTS documents_select ON documents;
DROP POLICY IF EXISTS documents_insert ON documents;
DROP POLICY IF EXISTS documents_update ON documents;
CREATE POLICY documents_select ON documents FOR SELECT USING (
  app_is_staff()
  OR (
    deleted_at IS NULL AND status = 'published' AND (expires_at IS NULL OR expires_at > now()) AND (
      audience_kind = 'all'
      OR (audience_kind = 'categories'
          AND (SELECT p.category FROM partners p WHERE p.id = app_partner_id()) = ANY (audience_categories))
      OR (audience_kind = 'named'
          AND EXISTS (SELECT 1 FROM document_audience a WHERE a.document_id = documents.id AND a.partner_id = app_partner_id()))
    )
  )
);
CREATE POLICY documents_insert ON documents FOR INSERT WITH CHECK (app_is_staff());
CREATE POLICY documents_update ON documents FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());

DROP POLICY IF EXISTS document_audience_select ON document_audience;
DROP POLICY IF EXISTS document_audience_insert ON document_audience;
DROP POLICY IF EXISTS document_audience_delete ON document_audience;
CREATE POLICY document_audience_select ON document_audience FOR SELECT USING (app_is_staff() OR partner_id = app_partner_id());
CREATE POLICY document_audience_insert ON document_audience FOR INSERT WITH CHECK (app_is_staff());
CREATE POLICY document_audience_delete ON document_audience FOR DELETE USING (app_is_staff());

-- A partner reads and creates its own company's material requests; only staff change them (status, response, linked document).
DROP POLICY IF EXISTS material_requests_select ON material_requests;
DROP POLICY IF EXISTS material_requests_insert ON material_requests;
DROP POLICY IF EXISTS material_requests_update ON material_requests;
CREATE POLICY material_requests_select ON material_requests FOR SELECT USING (app_is_staff() OR partner_id = app_partner_id());
CREATE POLICY material_requests_insert ON material_requests FOR INSERT WITH CHECK (app_is_staff() OR partner_id = app_partner_id());
CREATE POLICY material_requests_update ON material_requests FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());

-- ---------------------------------------------------------------- user private
DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_select ON notifications FOR SELECT USING (app_is_system() OR user_id = app_user_id());
CREATE POLICY notifications_insert ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (app_is_system() OR user_id = app_user_id()) WITH CHECK (app_is_system() OR user_id = app_user_id());

DROP POLICY IF EXISTS notification_prefs_all ON notification_prefs;
CREATE POLICY notification_prefs_all ON notification_prefs FOR ALL
  USING (app_is_system() OR user_id = app_user_id()) WITH CHECK (app_is_system() OR user_id = app_user_id());

-- ---------------------------------------------------------------- staff only
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['applications', 'application_notes', 'application_tokens', 'document_versions', 'registration_reminders', 'hubspot_sync_state'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_staff', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (app_is_staff()) WITH CHECK (app_is_staff())', t || '_staff', t);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------- staff_scopes
-- Partners may read the scope of active partner managers, so the register form can offer the manager for each region.
DROP POLICY IF EXISTS staff_scopes_select ON staff_scopes;
DROP POLICY IF EXISTS staff_scopes_write ON staff_scopes;
CREATE POLICY staff_scopes_select ON staff_scopes FOR SELECT USING (
  app_is_staff()
  OR user_id IN (SELECT u.id FROM users u WHERE u.kind = 'staff' AND u.role = 'partner_manager' AND u.status = 'active')
);
CREATE POLICY staff_scopes_write ON staff_scopes FOR ALL USING (app_is_staff()) WITH CHECK (app_is_staff());

-- ---------------------------------------------------------------- regions
-- Any signed in user (and the system, which serves the public apply form) reads the list; only staff change it.
DROP POLICY IF EXISTS regions_select ON regions;
DROP POLICY IF EXISTS regions_insert ON regions;
DROP POLICY IF EXISTS regions_update ON regions;
CREATE POLICY regions_select ON regions FOR SELECT USING (app_kind() IN ('staff', 'partner', 'system'));
CREATE POLICY regions_insert ON regions FOR INSERT WITH CHECK (app_is_staff());
CREATE POLICY regions_update ON regions FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());

-- ---------------------------------------------------------------- audit_log and hubspot_outbox
DROP POLICY IF EXISTS audit_log_insert ON audit_log;
DROP POLICY IF EXISTS audit_log_select ON audit_log;
CREATE POLICY audit_log_insert ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY audit_log_select ON audit_log FOR SELECT USING (app_is_staff());

DROP POLICY IF EXISTS hubspot_outbox_insert ON hubspot_outbox;
DROP POLICY IF EXISTS hubspot_outbox_select ON hubspot_outbox;
DROP POLICY IF EXISTS hubspot_outbox_update ON hubspot_outbox;
CREATE POLICY hubspot_outbox_insert ON hubspot_outbox FOR INSERT WITH CHECK (true);
CREATE POLICY hubspot_outbox_select ON hubspot_outbox FOR SELECT USING (app_is_staff());
CREATE POLICY hubspot_outbox_update ON hubspot_outbox FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());

-- ---------------------------------------------------------------- Better Auth tables: system connections only
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['auth_session', 'auth_account', 'auth_verification', 'auth_two_factor'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_system', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (app_is_system()) WITH CHECK (app_is_system())', t || '_system', t);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------- grants for the runtime role
GRANT USAGE ON SCHEMA public TO portal_app;
GRANT EXECUTE ON FUNCTION app_kind(), app_partner_id(), app_user_id(), app_is_system(), app_is_staff() TO portal_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO portal_app;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('audit_log', '__drizzle_migrations') LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON %I TO portal_app', t);
  END LOOP;
END
$$;

REVOKE ALL ON audit_log FROM portal_app;
GRANT SELECT, INSERT ON audit_log TO portal_app;

-- DELETE is granted only where a flow needs it; the policies above further restrict who may use it.
GRANT DELETE ON
  registrations, registration_contacts, registration_messages, registration_events, registration_reminders,
  applications, document_versions, document_audience, auth_session, auth_account, auth_verification, auth_two_factor
TO portal_app;
