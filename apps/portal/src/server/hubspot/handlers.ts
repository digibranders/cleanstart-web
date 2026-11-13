// handlers.ts
import { eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { partners, users } from '@/db/schema';
import type { Handlers } from './outbox';
import { DependencyPending, type HubspotApi } from './types';

const CATEGORY_VALUE = { distributor: 'distributor', channel: 'channel_partner', integrator: 'system_integrator' } as const;

const need = <T>(value: T | undefined | null, what: string): T => {
  if (value === undefined || value === null) throw new Error(`${what} not found`);
  return value;
};

export const buildHandlers = (db: Db, hs: HubspotApi, _pipelineId: string): Handlers => ({
  'partner.upsert': async (partnerId) => {
    const p = need((await db.select().from(partners).where(eq(partners.id, partnerId)))[0], `partner ${partnerId}`);
    const manager = p.managerId ? (await db.select().from(users).where(eq(users.id, p.managerId)))[0] : undefined;
    const existing = p.hubspotCompanyId ?? (await hs.findCompany({ domain: p.domain, name: p.name }))?.id ?? null;
    const { id } = await hs.createOrUpdateCompany({
      existingId: existing,
      name: p.name,
      domain: p.domain,
      properties: {
        cleanstart_partner: 'true',
        partner_category: CATEGORY_VALUE[p.category],
        partner_portal_id: p.id,
        ...(manager ? { partner_manager: manager.name } : {}),
      },
    });
    await db.update(partners).set({ hubspotCompanyId: id }).where(eq(partners.id, p.id));
  },

  'user.upsert': async (userId) => {
    const u = need((await db.select().from(users).where(eq(users.id, userId)))[0], `user ${userId}`);
    if (u.kind !== 'partner' || !u.partnerId) return;
    const p = need((await db.select().from(partners).where(eq(partners.id, u.partnerId)))[0], `partner ${u.partnerId}`);
    if (!p.hubspotCompanyId) throw new DependencyPending(`partner ${p.id} is not in HubSpot yet`);
    const [firstName = '', ...rest] = u.name.split(' ');
    const { id } = await hs.upsertContact({ email: u.email, firstName, lastName: rest.join(' ') });
    await hs.associateContactWithCompany(id, p.hubspotCompanyId);
    await db.update(users).set({ hubspotContactId: id }).where(eq(users.id, u.id));
  },

  'registration.create': async () => { throw new Error('implemented in task 4.6'); },
  'registration.update_end': async () => { throw new Error('implemented in task 4.6'); },
  'registration.expire': async () => { throw new Error('implemented in task 4.6'); },
});
