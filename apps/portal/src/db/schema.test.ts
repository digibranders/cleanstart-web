import { Client } from 'pg';
import { describe, expect, it } from 'vitest';
import { resetDb, testDb } from '@/db/test-helpers';
import { sql } from 'drizzle-orm';

const ownerClient = async (): Promise<Client> => {
  const client = new Client({ connectionString: process.env.PORTAL_TEST_OWNER_URL });
  await client.connect();
  return client;
};

/** Drizzle wraps the driver error in "Failed query"; the Postgres message is on `cause`. */
const expectDatabaseError = async (promise: Promise<unknown>, pattern: RegExp): Promise<void> => {
  const error = await promise.then(() => null, (thrown: unknown) => thrown);
  expect(error).not.toBeNull();
  const cause = (error as { cause?: { message?: string } }).cause;
  expect(cause?.message ?? (error as Error).message).toMatch(pattern);
};

const EXPECTED_TABLES = [
  'access_requests', 'application_notes', 'application_tokens', 'applications', 'audit_log', 'auth_account', 'auth_session', 'auth_two_factor',
  'auth_verification', 'dashboard_layouts', 'document_audience', 'document_opens', 'document_versions', 'documents', 'email_change_requests', 'hubspot_outbox',
  'hubspot_sync_state', 'invites', 'material_requests', 'notification_prefs', 'notifications', 'partner_checklist', 'partners',
  'regions', 'registration_contacts', 'registration_events', 'registration_messages', 'registration_reminders', 'registrations',
  'staff_regions', 'staff_scopes', 'users',
];

describe('schema', () => {
  it('has every table', async () => {
    const owner = await ownerClient();
    try {
      const { rows } = await owner.query<{ tablename: string }>("select tablename from pg_tables where schemaname = 'public' order by 1");
      expect(rows.map((r) => r.tablename)).toEqual(EXPECTED_TABLES);
    } finally {
      await owner.end();
    }
  });

  it('has the open registration unique index and the trigram indexes', async () => {
    const owner = await ownerClient();
    try {
      const { rows } = await owner.query<{ indexname: string }>("select indexname from pg_indexes where schemaname = 'public'");
      const names = rows.map((r) => r.indexname);
      expect(names).toEqual(expect.arrayContaining([
        'registrations_open_unique', 'registrations_customer_trgm', 'partners_name_trgm', 'documents_title_trgm',
        'users_name_trgm', 'users_email_trgm', 'applications_open_portal_email_key',
      ]));
    } finally {
      await owner.end();
    }
  });

  it('keeps the runtime role from owning tables or bypassing row level security', async () => {
    const owner = await ownerClient();
    try {
      const role = await owner.query<{ rolbypassrls: boolean; rolsuper: boolean }>("select rolbypassrls, rolsuper from pg_roles where rolname = 'portal_app'");
      expect(role.rows[0]).toEqual({ rolbypassrls: false, rolsuper: false });
      const owned = await owner.query("select 1 from pg_tables where schemaname = 'public' and tableowner = 'portal_app'");
      expect(owned.rowCount).toBe(0);
      const forced = await owner.query<{ relname: string }>("select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity)");
      expect(forced.rows).toEqual([]);
    } finally {
      await owner.end();
    }
  });

  it('rejects UPDATE and DELETE on audit_log for the app role', async () => {
    await resetDb();
    const db = testDb();
    await db.execute(sql`insert into audit_log (actor_label, who, kind, event, text) values ('t', 'staff', 'partners', 'partner.created', 't')`);
    await expectDatabaseError(db.execute(sql`update audit_log set text = 'changed'`), /permission denied/);
    await expectDatabaseError(db.execute(sql`delete from audit_log`), /permission denied/);
  });

  it('changes no audit_log row even for the owner (forced row level security, no UPDATE or DELETE policy)', async () => {
    const owner = await ownerClient();
    try {
      expect((await owner.query("update audit_log set text = 'changed'")).rowCount).toBe(0);
      expect((await owner.query('delete from audit_log')).rowCount).toBe(0);
    } finally {
      await owner.end();
    }
    expect((await testDb().execute(sql`select text from audit_log`)).rows).toEqual([{ text: 't' }]);
  });
});
