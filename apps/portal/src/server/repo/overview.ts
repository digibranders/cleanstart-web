import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { accessRequests, invites, registrations } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { addDays, daysBetween, daysLeft, fmtShort, plural } from '@/lib/dates';
import { EXPIRING_SOON_DAYS, isOverSla, RECENT_DECISION_DAYS, waitingBusinessDays } from '@/lib/deal-rules';
import {
  isOneOf,
  PARTNER_ROLE_LABEL,
  PARTNER_ROLES,
  PRODUCT_LABEL,
  PRODUCT_SHORT_LABEL,
} from '@/lib/domain';
import type { AttentionItemDto, PartnerOverviewDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import { selectRows, toListItem } from '@/server/registrations/mappers';
import { registrationScope } from '@/server/registrations/scope';
import type { Tx } from './context';
import { listNewDocuments } from './documents';
import { defineIsolation } from './isolation.registry';

const DAY_MS = 86_400_000;
const NEW_DOCUMENTS = 3;
const RECENT_DEALS = 7;

const askedLabel = (at: Date, today: string): string => {
  const date = at.toISOString().slice(0, 10);
  const days = daysBetween(date, today);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : fmtShort(date);
};

/** Partner admin and partner sales. Sales: only deals they registered (ownDealsOnly = true). */
export async function getPartnerOverview(tx: Tx, viewer: Viewer, clock: Clock): Promise<PartnerOverviewDto> {
  if (viewer.kind !== 'partner' || viewer.role === 'technical') {
    throw new ForbiddenError('the overview is for partner admin and sales');
  }
  const today = clock.today();
  const scope = registrationScope(viewer);
  const horizon = addDays(today, EXPIRING_SOON_DAYS);
  const year = today.slice(0, 4);
  const recentCutoff = new Date(clock.now().getTime() - RECENT_DECISION_DAYS * DAY_MS);

  const waitingRows = await tx
    .select({
      id: registrations.id,
      customer: registrations.customerName,
      product: registrations.product,
      registeredOn: registrations.registeredOn,
      resubmittedOn: registrations.resubmittedOn,
    })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'pending')))
    .orderBy(asc(registrations.registeredOn), asc(registrations.id));
  const waitingDays = waitingRows.map((r) => waitingBusinessDays(r.resubmittedOn ?? r.registeredOn, today));

  const byProduct = await tx
    .select({ product: registrations.product, count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'accepted')))
    .groupBy(registrations.product)
    .orderBy(desc(sql`count(*)`), asc(registrations.product));

  const expiring = await tx
    .select({
      id: registrations.id,
      customer: registrations.customerName,
      product: registrations.product,
      end: registrations.protectionEnd,
    })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'accepted'), gte(registrations.protectionEnd, today), lte(registrations.protectionEnd, horizon)))
    .orderBy(asc(registrations.protectionEnd), asc(registrations.id));

  const won = await tx
    .select({ customer: registrations.customerName })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'won'), gte(registrations.closedOn, `${year}-01-01`), lte(registrations.closedOn, `${year}-12-31`)))
    .orderBy(desc(registrations.closedOn), asc(registrations.id));

  const declined = await tx
    .select({ id: registrations.id, customer: registrations.customerName, product: registrations.product })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'rejected'), gte(registrations.decidedAt, recentCutoff)))
    .orderBy(desc(registrations.decidedAt), asc(registrations.id));

  const recent = await selectRows(tx)
    .where(and(scope, inArray(registrations.status, ['pending', 'accepted', 'won'])))
    .orderBy(desc(registrations.registeredOn), desc(registrations.createdAt), desc(registrations.id))
    .limit(RECENT_DEALS);

  const attention: AttentionItemDto[] = [];
  if (viewer.role === 'partner_admin') {
    const requests = await tx
      .select()
      .from(accessRequests)
      .where(and(eq(accessRequests.partnerId, viewer.partnerId), eq(accessRequests.status, 'open')))
      .orderBy(asc(accessRequests.createdAt));
    for (const r of requests) {
      attention.push({
        key: `access-${r.id}`,
        kind: 'access_request',
        title: `${r.name} asked for a login`,
        meta: `${PARTNER_ROLE_LABEL[r.requestedRole]}, asked ${askedLabel(r.createdAt, today)}`,
        href: ROUTES.partner.team,
      });
    }
  }
  for (const d of expiring) {
    attention.push({
      key: `exp-${d.id}`,
      kind: 'expiring',
      title: `${d.customer} expires in ${plural(daysLeft(d.end ?? today, today), 'day')}`,
      meta: `${PRODUCT_SHORT_LABEL[d.product]}, protected until ${fmtShort(d.end ?? today)}`,
      href: ROUTES.partner.deal(d.id),
    });
  }
  waitingRows.forEach((r, index) => {
    if (!isOverSla(r.resubmittedOn ?? r.registeredOn, today)) return;
    attention.push({
      key: `late-${r.id}`,
      kind: 'late',
      title: `${r.customer} waiting ${plural(waitingDays[index] ?? 0, 'day')}`,
      meta: `${PRODUCT_LABEL[r.product]}, sent ${fmtShort(r.registeredOn)}`,
      href: ROUTES.partner.deals,
    });
  });
  for (const d of declined) {
    attention.push({
      key: `rej-${d.id}`,
      kind: 'declined',
      title: `${d.customer} was not accepted`,
      meta: `${PRODUCT_LABEL[d.product]}, see the reason and resubmit`,
      href: ROUTES.partner.deals,
    });
  }
  if (viewer.role === 'partner_admin') {
    const open = await tx
      .select()
      .from(invites)
      .where(and(eq(invites.partnerId, viewer.partnerId), isNull(invites.acceptedAt), isNull(invites.revokedAt), gte(invites.expiresAt, clock.now())))
      .orderBy(asc(invites.createdAt));
    for (const invite of open) {
      const role = isOneOf(PARTNER_ROLES, invite.role) ? PARTNER_ROLE_LABEL[invite.role] : invite.role;
      attention.push({
        key: `invite-${invite.id}`,
        kind: 'invite_pending',
        title: `${invite.email} has not accepted invite`,
        meta: `${role}, invited ${fmtShort(invite.createdAt.toISOString().slice(0, 10))}`,
        href: ROUTES.partner.team,
      });
    }
  }

  return {
    ownDealsOnly: viewer.role === 'sales',
    waiting: { count: waitingRows.length, oldestDays: Math.max(0, ...waitingDays) },
    protectedNow: {
      count: byProduct.reduce((n, p) => n + p.count, 0),
      byProduct: byProduct.map((p) => ({ product: p.product, count: p.count })),
    },
    expiring14: { count: expiring.length, customers: expiring.map((d) => d.customer) },
    wonThisYear: { count: won.length, customers: won.map((d) => d.customer) },
    attention,
    recent: recent.map(toListItem),
    newDocuments: await listNewDocuments(tx, viewer, { limit: NEW_DOCUMENTS }, clock),
  };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'getPartnerOverview'>({
  getPartnerOverview: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer) => (await getPartnerOverview(tx, viewer, probeClock)).recent.filter((r) => r.partnerId !== viewer.partnerId),
  },
});
