import { and, eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { partners, registrationContacts, registrations, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { PARTNER_REGION_LABEL, PRODUCT_LABEL } from '@/lib/domain';
import { log } from '@/server/log';
import { dealProperties } from './mappers';
import type { Handlers } from './outbox';
import { DependencyPending, type HubspotApi } from './types';

const CATEGORY_VALUE = { distributor: 'distributor', channel: 'channel_partner', integrator: 'system_integrator' } as const;

const need = <T>(value: T | undefined | null, what: string): T => {
  if (value === undefined || value === null) throw new Error(`${what} not found`);
  return value;
};

export const buildHandlers = (db: Db, hs: HubspotApi, pipelineId: string, clock: Clock = systemClock): Handlers => {
  const loadReg = async (id: string) => {
    const reg = need((await db.select().from(registrations).where(eq(registrations.id, id)))[0], `registration ${id}`);
    const partner = need((await db.select().from(partners).where(eq(partners.id, reg.partnerId)))[0], `partner ${reg.partnerId}`);
    return { reg, partner };
  };
  const requireDeal = (reg: { id: string; hubspotDealId: string | null }): string => {
    if (!reg.hubspotDealId) throw new DependencyPending(`registration ${reg.id} has no HubSpot deal yet`);
    return reg.hubspotDealId;
  };

  return {
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

    'registration.create': async (registrationId) => {
      const { reg, partner } = await loadReg(registrationId);
      if (reg.status !== 'accepted') return;
      if (!partner.hubspotCompanyId) throw new DependencyPending(`partner ${partner.id} is not in HubSpot yet`);
      if (!reg.protectionEnd) throw new Error(`registration ${reg.id} is accepted without a protection end`);

      // A stored deal id means an earlier run got as far as the deal: skip the create and redo the links, which are idempotent.
      let dealId = reg.hubspotDealId;
      if (!dealId) {
        const stageIds = await hs.getStageIds(pipelineId);
        const deal =
          (await hs.findDealByRegistrationId(reg.id)) ??
          (await hs.createDeal(
            dealProperties(
              {
                id: reg.id,
                customerName: reg.customerName,
                product: PRODUCT_LABEL[reg.product],
                region: PARTNER_REGION_LABEL[reg.region],
                protectionEnd: reg.protectionEnd,
                reference: reg.reference,
                dealValue: reg.dealValue,
                currency: reg.currency,
                customerCountry: reg.customerCountry,
                customerIndustry: reg.customerIndustry,
                useCase: reg.useCase,
                competitor: reg.competitor,
                seats: reg.seats,
                salesStage: reg.salesStage,
                decisionDate: reg.decisionDate,
              },
              { name: partner.name, hubspotCompanyId: partner.hubspotCompanyId },
              stageIds,
              pipelineId,
            ),
          ));
        // Save the id before the links: a failure below retries against the same deal, and the stored id is what routes that retry to the links.
        // The status guard is in the same statement: a registration undone since the create started must not get a deal id.
        const saved = await db
          .update(registrations)
          .set({ hubspotDealId: deal.id, hubspotStageId: deal.stageId, hubspotSyncedAt: clock.now() })
          .where(and(eq(registrations.id, reg.id), eq(registrations.status, 'accepted')))
          .returning({ id: registrations.id });
        if (saved.length === 0) {
          // HubspotApi has no archive call, so the deal stays in HubSpot. A later accept finds it by portal_registration_id.
          log.warn({ registrationId: reg.id, dealId: deal.id }, 'registration was undone while its HubSpot deal was created; deal left in HubSpot, id not stored');
          return;
        }
        dealId = deal.id;
      }

      const customer = (await hs.findCompany({ domain: reg.customerDomain, name: reg.customerName }))
        ?? (await hs.createOrUpdateCompany({ existingId: null, name: reg.customerName, domain: reg.customerDomain, properties: {} }));
      await hs.associateDealWithCompany(dealId, partner.hubspotCompanyId, 'partner');
      await hs.associateDealWithCompany(dealId, customer.id, 'customer');

      const contacts = await db.select().from(registrationContacts).where(eq(registrationContacts.registrationId, reg.id));
      for (const c of contacts) {
        if (!c.email) continue;
        const [firstName = '', ...rest] = c.name.split(' ');
        const { id } = await hs.upsertContact({ email: c.email, firstName, lastName: rest.join(' '), ...(c.phone ? { phone: c.phone } : {}) });
        await hs.associateDealWithContact(dealId, id);
        await db.update(registrationContacts).set({ hubspotContactId: id }).where(eq(registrationContacts.id, c.id));
      }
    },

    'registration.update_end': async (registrationId) => {
      const { reg } = await loadReg(registrationId);
      const dealId = requireDeal(reg);
      if (!reg.protectionEnd) return;
      await hs.updateDeal(dealId, { protection_end_date: reg.protectionEnd });
    },

    'registration.expire': async (registrationId) => {
      const { reg } = await loadReg(registrationId);
      // Only a registration that is still expired in the portal is pushed: HubSpot may have moved the deal back since this was queued.
      // An expired registration that never got a deal (its create never ran, and now never will) has nothing to move.
      if (reg.status !== 'expired' || !reg.hubspotDealId) return;
      const dealId = reg.hubspotDealId;
      const stageIds = await hs.getStageIds(pipelineId);
      await hs.updateDeal(dealId, { dealstage: stageIds['Registration expired'] });
      await db.update(registrations).set({ hubspotStageId: stageIds['Registration expired'], hubspotSyncedAt: clock.now() }).where(eq(registrations.id, reg.id));
    },
  };
};
