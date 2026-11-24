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
    'regions', 'partners', 'users', 'staff_scopes', 'staff_regions', 'partner_checklist', 'applications', 'application_notes', 'application_tokens', 'invites', 'access_requests',
    'registrations', 'registration_contacts', 'registration_messages', 'registration_events', 'registration_reminders',
    'documents', 'document_audience', 'document_versions', 'document_opens', 'material_requests', 'email_change_requests',
    'notifications', 'notification_prefs', 'dashboard_layouts', 'audit_log', 'hubspot_outbox', 'hubspot_sync_state',
    'auth_session', 'auth_account', 'auth_verification', 'auth_two_factor',
    'chat_conversations', 'chat_members', 'chat_messages', 'chat_attachments', 'chat_reactions', 'chat_pins', 'chat_typing', 'chat_presence'
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

DROP POLICY IF EXISTS dashboard_layouts_all ON dashboard_layouts;
CREATE POLICY dashboard_layouts_all ON dashboard_layouts FOR ALL
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

-- ---------------------------------------------------------------- staff_regions
-- Same audience as staff_scopes: partners read the regions of active partner managers (the register form offers the manager for a region).
DROP POLICY IF EXISTS staff_regions_select ON staff_regions;
DROP POLICY IF EXISTS staff_regions_write ON staff_regions;
CREATE POLICY staff_regions_select ON staff_regions FOR SELECT USING (
  app_is_staff()
  OR user_id IN (SELECT u.id FROM users u WHERE u.kind = 'staff' AND u.role = 'partner_manager' AND u.status = 'active')
);
CREATE POLICY staff_regions_write ON staff_regions FOR ALL USING (app_is_staff()) WITH CHECK (app_is_staff());

-- ---------------------------------------------------------------- regions
-- Any signed in user (and the system, which serves the public apply form) reads the list; only staff change it.
DROP POLICY IF EXISTS regions_select ON regions;
DROP POLICY IF EXISTS regions_insert ON regions;
DROP POLICY IF EXISTS regions_update ON regions;
CREATE POLICY regions_select ON regions FOR SELECT USING (app_kind() IN ('staff', 'partner', 'system'));
CREATE POLICY regions_insert ON regions FOR INSERT WITH CHECK (app_is_staff());
CREATE POLICY regions_update ON regions FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());

-- ---------------------------------------------------------------- messages (chat)
-- A conversation is visible to its current members (member_ids) and to the system (the digest job). Staff get no blanket access:
-- a staff user sees a chat only when they are in it. Every child table asks "can I see the conversation?", so no policy refers back to itself.

-- Guards on the conversation row. They run as the caller, so the users they read are only the ones that caller may read:
-- a partner cannot put a staff user they cannot see (or anyone from another company) into a chat.
CREATE OR REPLACE FUNCTION portal_chat_conversation_guard() RETURNS trigger LANGUAGE plpgsql AS
$$
DECLARE
  added uuid[];
  seen integer;
  wrong integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id OR NEW.kind <> OLD.kind OR NEW.created_by <> OLD.created_by
       OR NEW.direct_key IS DISTINCT FROM OLD.direct_key THEN
      RAISE EXCEPTION 'a chat keeps its company, kind and creator' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    IF NEW.kind = 'direct' AND NEW.member_ids IS DISTINCT FROM OLD.member_ids THEN
      RAISE EXCEPTION 'a direct chat keeps its two people' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    added := ARRAY(SELECT unnest(NEW.member_ids) EXCEPT SELECT unnest(OLD.member_ids));
  ELSE
    IF NEW.kind = 'direct' AND cardinality(NEW.member_ids) <> 2 THEN
      RAISE EXCEPTION 'a direct chat has exactly two people' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    added := NEW.member_ids;
  END IF;
  IF cardinality(NEW.member_ids) > 50 THEN
    RAISE EXCEPTION 'a chat has at most 50 people' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF cardinality(added) > 0 THEN
    SELECT count(*) INTO seen FROM users u WHERE u.id = ANY (added) AND u.status = 'active';
    IF seen <> cardinality(added) THEN
      RAISE EXCEPTION 'every new member must be an active person you can see' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    SELECT count(*) INTO wrong FROM users u
      WHERE u.id = ANY (added) AND NOT (u.kind = 'staff' OR (NEW.partner_id IS NOT NULL AND u.partner_id = NEW.partner_id));
    IF wrong > 0 THEN
      RAISE EXCEPTION 'a chat holds one partner company and CleanStart staff, nobody else' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS chat_conversation_guard ON chat_conversations;
CREATE TRIGGER chat_conversation_guard BEFORE INSERT OR UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION portal_chat_conversation_guard();

-- Only the sender changes what a message says. Anyone in the chat may bump rev (a reaction or a pin touches the row).
CREATE OR REPLACE FUNCTION portal_chat_message_guard() RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.conversation_id <> OLD.conversation_id OR NEW.seq <> OLD.seq OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.created_at <> OLD.created_at OR NEW.kind <> OLD.kind THEN
    RAISE EXCEPTION 'a message keeps its chat, number, sender and time' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF (NEW.body, NEW.refs, NEW.mentions, NEW.edited_at, NEW.deleted_at, NEW.reply_to_id)
       IS DISTINCT FROM (OLD.body, OLD.refs, OLD.mentions, OLD.edited_at, OLD.deleted_at, OLD.reply_to_id)
     AND NOT app_is_system() AND OLD.sender_id IS DISTINCT FROM app_user_id() THEN
    RAISE EXCEPTION 'only the sender can change a message' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS chat_message_guard ON chat_messages;
CREATE TRIGGER chat_message_guard BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION portal_chat_message_guard();

-- Read and delivery cursors, mute and digest position belong to their own person.
CREATE OR REPLACE FUNCTION portal_chat_member_guard() RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.conversation_id <> OLD.conversation_id OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'a membership keeps its chat and person' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF NOT app_is_system() AND OLD.user_id IS DISTINCT FROM app_user_id()
     AND (NEW.last_read_seq, NEW.last_delivered_seq, NEW.muted_until, NEW.digest_seq)
       IS DISTINCT FROM (OLD.last_read_seq, OLD.last_delivered_seq, OLD.muted_until, OLD.digest_seq) THEN
    RAISE EXCEPTION 'only the person can change their own read position' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS chat_member_guard ON chat_members;
CREATE TRIGGER chat_member_guard BEFORE UPDATE ON chat_members
  FOR EACH ROW EXECUTE FUNCTION portal_chat_member_guard();

DROP POLICY IF EXISTS chat_conversations_select ON chat_conversations;
DROP POLICY IF EXISTS chat_conversations_insert ON chat_conversations;
DROP POLICY IF EXISTS chat_conversations_update ON chat_conversations;
CREATE POLICY chat_conversations_select ON chat_conversations FOR SELECT USING (app_is_system() OR app_user_id() = ANY (member_ids));
-- A partner starts chats only in its own company; staff start staff only chats (partner_id null) or one with any partner.
CREATE POLICY chat_conversations_insert ON chat_conversations FOR INSERT WITH CHECK (
  app_is_system()
  OR (
    created_by = app_user_id() AND app_user_id() = ANY (member_ids)
    AND (app_kind() = 'staff' OR partner_id = app_partner_id())
  )
);
-- WITH CHECK is open on purpose: a person who leaves is no longer in member_ids afterwards. The guard trigger holds the invariants.
CREATE POLICY chat_conversations_update ON chat_conversations FOR UPDATE
  USING (app_is_system() OR app_user_id() = ANY (member_ids)) WITH CHECK (true);

DROP POLICY IF EXISTS chat_members_select ON chat_members;
DROP POLICY IF EXISTS chat_members_insert ON chat_members;
DROP POLICY IF EXISTS chat_members_update ON chat_members;
CREATE POLICY chat_members_select ON chat_members FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_members.conversation_id));
CREATE POLICY chat_members_insert ON chat_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_members.conversation_id AND chat_members.user_id = ANY (c.member_ids))
);
CREATE POLICY chat_members_update ON chat_members FOR UPDATE
  USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_members.conversation_id))
  WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_members.conversation_id));

DROP POLICY IF EXISTS chat_messages_select ON chat_messages;
DROP POLICY IF EXISTS chat_messages_insert ON chat_messages;
DROP POLICY IF EXISTS chat_messages_update ON chat_messages;
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id));
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT WITH CHECK (
  (app_is_system() OR sender_id = app_user_id())
  AND EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id)
);
CREATE POLICY chat_messages_update ON chat_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id))
  WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id));

DROP POLICY IF EXISTS chat_attachments_select ON chat_attachments;
DROP POLICY IF EXISTS chat_attachments_insert ON chat_attachments;
DROP POLICY IF EXISTS chat_attachments_update ON chat_attachments;
CREATE POLICY chat_attachments_select ON chat_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_attachments.conversation_id));
CREATE POLICY chat_attachments_insert ON chat_attachments FOR INSERT WITH CHECK (
  (app_is_system() OR uploader_id = app_user_id())
  AND EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_attachments.conversation_id)
);
CREATE POLICY chat_attachments_update ON chat_attachments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_attachments.conversation_id))
  WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_attachments.conversation_id));

DROP POLICY IF EXISTS chat_reactions_select ON chat_reactions;
DROP POLICY IF EXISTS chat_reactions_insert ON chat_reactions;
DROP POLICY IF EXISTS chat_reactions_delete ON chat_reactions;
CREATE POLICY chat_reactions_select ON chat_reactions FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_reactions.conversation_id));
CREATE POLICY chat_reactions_insert ON chat_reactions FOR INSERT WITH CHECK (
  user_id = app_user_id() AND EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_reactions.conversation_id)
);
CREATE POLICY chat_reactions_delete ON chat_reactions FOR DELETE USING (user_id = app_user_id());

DROP POLICY IF EXISTS chat_pins_select ON chat_pins;
DROP POLICY IF EXISTS chat_pins_insert ON chat_pins;
DROP POLICY IF EXISTS chat_pins_delete ON chat_pins;
CREATE POLICY chat_pins_select ON chat_pins FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_pins.conversation_id));
CREATE POLICY chat_pins_insert ON chat_pins FOR INSERT WITH CHECK (
  pinned_by = app_user_id() AND EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_pins.conversation_id)
);
CREATE POLICY chat_pins_delete ON chat_pins FOR DELETE USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_pins.conversation_id));

DROP POLICY IF EXISTS chat_typing_select ON chat_typing;
DROP POLICY IF EXISTS chat_typing_insert ON chat_typing;
DROP POLICY IF EXISTS chat_typing_update ON chat_typing;
DROP POLICY IF EXISTS chat_typing_delete ON chat_typing;
CREATE POLICY chat_typing_select ON chat_typing FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_typing.conversation_id));
CREATE POLICY chat_typing_insert ON chat_typing FOR INSERT WITH CHECK (
  user_id = app_user_id() AND EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_typing.conversation_id)
);
CREATE POLICY chat_typing_update ON chat_typing FOR UPDATE USING (user_id = app_user_id()) WITH CHECK (user_id = app_user_id());
CREATE POLICY chat_typing_delete ON chat_typing FOR DELETE USING (user_id = app_user_id());

-- Online dots: a person sees the presence of people they share a chat with.
DROP POLICY IF EXISTS chat_presence_select ON chat_presence;
DROP POLICY IF EXISTS chat_presence_insert ON chat_presence;
DROP POLICY IF EXISTS chat_presence_update ON chat_presence;
CREATE POLICY chat_presence_select ON chat_presence FOR SELECT USING (
  app_is_system() OR user_id = app_user_id()
  OR EXISTS (SELECT 1 FROM chat_conversations c WHERE chat_presence.user_id = ANY (c.member_ids))
);
CREATE POLICY chat_presence_insert ON chat_presence FOR INSERT WITH CHECK (app_is_system() OR user_id = app_user_id());
CREATE POLICY chat_presence_update ON chat_presence FOR UPDATE USING (app_is_system() OR user_id = app_user_id()) WITH CHECK (app_is_system() OR user_id = app_user_id());

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
  applications, document_versions, document_audience, staff_regions, auth_session, auth_account, auth_verification, auth_two_factor,
  chat_reactions, chat_pins, chat_typing
TO portal_app;
