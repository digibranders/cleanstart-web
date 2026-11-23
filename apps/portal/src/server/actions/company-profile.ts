'use server';

import { z } from 'zod';
import { companyDetailsFields, normaliseDetails } from '@/lib/company-profile';
import type { UploadTicketDto } from '@/lib/document-upload';
import type { CompanyDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { ValidationError } from '@/server/errors';
import { getFileStorage } from '@/server/files/instance';
import { createLogoTicket, verifyLogo } from '@/server/files/logo';
import { cleanOriginalName } from '@/server/files/rules';
import { withViewer } from '@/server/repo/context';
import { getCompany, setPartnerLogo, updateCompanyDetails } from '@/server/repo/partners';
import { rateLimit } from '@/server/rate-limit';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const partnerId = z.string().uuid().optional();
const detailsSchema = z.object({ partnerId, ...companyDetailsFields });
const ticketSchema = z.object({ partnerId, originalName: z.string().trim().min(1).max(255), size: z.number().int().min(0) });
const confirmSchema = z.object({ partnerId, key: z.string().min(1).max(300), originalName: z.string().trim().min(1).max(255), size: z.number().int().min(1) });
const removeSchema = z.object({ partnerId });

const DETAIL_LABEL = {
  legalName: 'legal name',
  taxId: 'tax ID',
  hqCountry: 'HQ country',
  headcountBand: 'headcount',
  billingContactName: 'billing contact name',
  billingContactEmail: 'billing contact email',
  supportContactName: 'support contact name',
  supportContactEmail: 'support contact email',
} as const;

const LOGOS_PER_HOUR = 20;

const targetOf = (viewer: Parameters<typeof assertCan>[0], requested: string | undefined): string => {
  const target = requested ?? (viewer.kind === 'partner' ? viewer.partnerId : undefined);
  if (!target) throw new ValidationError([{ path: 'partnerId', message: 'Choose a partner.' }]);
  assertCan(viewer, 'partner.update_details', { partnerId: target });
  return target;
};

/** Company details card (partner admin, own company) and the staff details dialog (any company). Not sent to the CRM. */
export async function updateCompanyDetailsAction(raw: unknown): Promise<ActionResult<CompanyDto>> {
  return runViewerAction({ name: 'partner.update_details', schema: detailsSchema }, raw, async (ctx, input): Promise<CompanyDto> => {
    const target = targetOf(ctx.viewer, input.partnerId);
    const { partnerId: _omit, ...details } = input;
    const result = await withViewer(ctx.viewer, async (tx) => {
      const saved = await updateCompanyDetails(tx, ctx.viewer, { partnerId: target, details: normaliseDetails(details) });
      if (saved.changed.length > 0) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.details_updated',
          target: saved.company.name,
          note: `Updated ${saved.changed.map((key) => DETAIL_LABEL[key]).join(', ')}`,
          partnerId: target,
          subject: { type: 'partner', id: target },
        });
      }
      return saved.company;
    });
    ctx.revalidate(ROUTES.partner.company);
    ctx.revalidate(ROUTES.admin.partners);
    return result;
  });
}

/** Step 1 of a logo upload: validates the type and the 1 MB limit, returns a presigned PUT. */
export async function createLogoTicketAction(raw: unknown): Promise<ActionResult<UploadTicketDto>> {
  return runViewerAction({ name: 'partner.logo_ticket', schema: ticketSchema }, raw, async (ctx, input): Promise<UploadTicketDto> => {
    const target = targetOf(ctx.viewer, input.partnerId);
    rateLimit(`logo-ticket:user:${ctx.viewer.id}`, { limit: LOGOS_PER_HOUR, windowSeconds: 3600 });
    await withViewer(ctx.viewer, (tx) => getCompany(tx, ctx.viewer, { partnerId: target }));
    const originalName = cleanOriginalName(input.originalName);
    const { key, put } = await createLogoTicket(getFileStorage(), { partnerId: target, originalName, size: input.size });
    return { key, url: put.url, headers: put.headers, expiresAt: put.expiresAt.toISOString(), originalName, size: input.size };
  });
}

/** Step 2: the browser finished the PUT. Checks the object, stores the key, deletes the old logo object after commit. */
export async function confirmLogoAction(raw: unknown): Promise<ActionResult<CompanyDto>> {
  return runViewerAction({ name: 'partner.logo_confirm', schema: confirmSchema }, raw, async (ctx, input): Promise<CompanyDto> => {
    const target = targetOf(ctx.viewer, input.partnerId);
    const storage = getFileStorage();
    const key = await verifyLogo(storage, { partnerId: target, key: input.key, size: input.size, originalName: input.originalName });
    const saved = await withViewer(ctx.viewer, async (tx) => {
      const result = await setPartnerLogo(tx, ctx.viewer, { partnerId: target, key });
      await recordAudit(tx, ctx.viewer, {
        event: 'partner.logo_changed',
        target: result.company.name,
        note: result.previousKey ? 'Replaced the logo' : 'Added a logo',
        partnerId: target,
        subject: { type: 'partner', id: target },
      });
      return result;
    });
    const previous = saved.previousKey;
    if (previous) ctx.afterCommit(() => storage.delete(previous));
    ctx.revalidate(ROUTES.partner.company);
    ctx.revalidate(ROUTES.admin.partners);
    return saved.company;
  });
}

export async function removeLogoAction(raw: unknown): Promise<ActionResult<CompanyDto>> {
  return runViewerAction({ name: 'partner.logo_remove', schema: removeSchema }, raw, async (ctx, input): Promise<CompanyDto> => {
    const target = targetOf(ctx.viewer, input.partnerId);
    const saved = await withViewer(ctx.viewer, async (tx) => {
      const result = await setPartnerLogo(tx, ctx.viewer, { partnerId: target, key: null });
      if (result.previousKey) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.logo_changed',
          target: result.company.name,
          note: 'Removed the logo',
          partnerId: target,
          subject: { type: 'partner', id: target },
        });
      }
      return result;
    });
    const previous = saved.previousKey;
    if (previous) ctx.afterCommit(() => getFileStorage().delete(previous));
    ctx.revalidate(ROUTES.partner.company);
    ctx.revalidate(ROUTES.admin.partners);
    return saved.company;
  });
}
