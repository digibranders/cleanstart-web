// Must be first: sets the database and the fakes before any src/ module reads the environment.
import './env';
import { eq } from 'drizzle-orm';
import { Client } from 'pg';
import type { Db } from '@/db/client';
import { auditLog, documents, hubspotOutbox, partners, registrations, users } from '@/db/schema';
import { makeDocument, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { recordAudit } from '@/server/audit/record';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ARBOR, assertE2eDatabase, E2E, KESTREL, OPEN_DOC, PERSONAS, RESTRICTED_DOC } from './env';

export const db = (): Db => testDb();

/** The URL check is on a string the run wrote; this asks the server which database that connection really reached. */
async function assertConnectedToE2eDatabase(url: string): Promise<void> {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ current_database: string }>('select current_database()');
    if (rows[0]?.current_database !== E2E.database) {
      throw new Error(`Refusing to reset: connected to ${rows[0]?.current_database ?? 'no database'}, the e2e run only touches ${E2E.database}.`);
    }
  } finally {
    await client.end();
  }
}

/** Two partners, their people, two staff, two documents and a few audit rows. Runs once, before the browser tests. */
export async function seedBase(): Promise<void> {
  assertE2eDatabase(process.env.PORTAL_TEST_DATABASE_URL ?? '');
  assertE2eDatabase(process.env.PORTAL_TEST_OWNER_URL ?? '');
  await assertConnectedToE2eDatabase(process.env.PORTAL_TEST_OWNER_URL ?? '');
  const d = db();
  await resetDb(d);

  const kestrel = await makePartner(d, { name: KESTREL, domain: 'kestrel-e2e.test', category: 'channel', region: 'india' });
  const arbor = await makePartner(d, { name: ARBOR, domain: 'arbor-e2e.test', category: 'distributor', region: 'middle_east' });

  const staff = (key: 'manager' | 'marketing', role: 'partner_manager' | 'marketing') =>
    makeUser(d, { kind: 'staff', role, region: 'all', email: PERSONAS[key].email, name: PERSONAS[key].name, password: E2E.password });
  await staff('manager', 'partner_manager');
  await staff('marketing', 'marketing');

  const partnerUser = (key: 'kestrelAdmin' | 'kestrelSales' | 'kestrelTechnical' | 'arborAdmin', partnerId: string, role: 'partner_admin' | 'sales' | 'technical') =>
    makeUser(d, { partnerId, role, email: PERSONAS[key].email, name: PERSONAS[key].name, password: E2E.password });
  const kestrelAdmin = await partnerUser('kestrelAdmin', kestrel.id, 'partner_admin');
  await partnerUser('kestrelSales', kestrel.id, 'sales');
  await partnerUser('kestrelTechnical', kestrel.id, 'technical');
  await partnerUser('arborAdmin', arbor.id, 'partner_admin');

  await makeRegistration(d, { partnerId: kestrel.id, customerName: 'Vardhan Capital E2E', product: 'cleansight', region: 'india', status: 'pending', registeredBy: kestrelAdmin.id });

  await makeDocument(d, { title: RESTRICTED_DOC, type: 'datasheet', audienceKind: 'named', partnerIds: [kestrel.id] });
  await makeDocument(d, { title: OPEN_DOC, type: 'datasheet', audienceKind: 'all' });

  await d.transaction(async (tx) => {
    await recordAudit(tx, SYSTEM_ACTORS.portal, { event: 'partner.created', target: KESTREL, partnerId: kestrel.id });
    await recordAudit(tx, SYSTEM_ACTORS.hubspot, { event: 'registration.stage_changed', target: 'Vardhan Capital E2E, CleanSight', note: 'Stage changed to Discovery', source: 'crm' });
  });
}

export async function documentIdByTitle(title: string): Promise<string> {
  const [row] = await db().select({ id: documents.id }).from(documents).where(eq(documents.title, title));
  if (!row) throw new Error(`seeded document not found: ${title}`);
  return row.id;
}

export async function seededRegistrationId(customer: string): Promise<string> {
  const [row] = await db().select({ id: registrations.id }).from(registrations).where(eq(registrations.customerName, customer));
  if (!row) throw new Error(`registration not found: ${customer}`);
  return row.id;
}

export async function registrationByCustomer(customer: string): Promise<typeof registrations.$inferSelect> {
  const [row] = await db().select().from(registrations).where(eq(registrations.customerName, customer));
  if (!row) throw new Error(`registration not found: ${customer}`);
  return row;
}

export async function userByEmail(email: string): Promise<typeof users.$inferSelect> {
  const [row] = await db().select().from(users).where(eq(users.email, email));
  if (!row) throw new Error(`user not found: ${email}`);
  return row;
}

export async function partnerByName(name: string): Promise<typeof partners.$inferSelect> {
  const [row] = await db().select().from(partners).where(eq(partners.name, name));
  if (!row) throw new Error(`partner not found: ${name}`);
  return row;
}

export async function auditCount(): Promise<number> {
  return (await db().select().from(auditLog)).length;
}

/** A pending partner invite for a seeded company, with its clear token (only the hash is stored). */
export async function seedInviteToken(partner: string, email: string): Promise<string> {
  const { token } = await makeInvite(db(), { partnerId: (await partnerByName(partner)).id, email, role: 'sales' });
  return token;
}

export async function outboxRowsFor(subjectId: string, op: string): Promise<number> {
  return (await db().select().from(hubspotOutbox).where(eq(hubspotOutbox.subjectId, subjectId))).filter((r) => r.op === op).length;
}
