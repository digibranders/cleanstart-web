export type DealRegistrationNotificationInput = {
  partnerName: string;
  partnerRep: { firstName: string; lastName: string; email: string; phone?: string | undefined };
  prospect: { firstName: string; lastName: string; email: string; phone?: string | undefined };
  dealDetails?: string | undefined;
  /** HubSpot deal id when the CRM sync succeeded — renders a link to the record. */
  dealId?: string | undefined;
  /** HubSpot portal id, used only to build the deal link. */
  portalId?: string | undefined;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const row = (label: string, value: string | undefined): string =>
  value && value.trim().length > 0
    ? `<tr><td style="padding:4px 12px 4px 0;color:#555;font-weight:600;vertical-align:top;">${label}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`
    : '';

/**
 * Builds the internal-notification subject + HTML for a new partner deal
 * registration. Self-contained (no Brevo dashboard template) so the exact same
 * markup can be reused for every recipient. All submitter-supplied values are
 * HTML-escaped. The deal name mirrors `buildDealName` (`{prospect} — {partner}`).
 */
export const buildDealRegistrationNotificationEmail = (
  input: DealRegistrationNotificationInput,
): { subject: string; htmlContent: string } => {
  const prospectFull = `${input.prospect.firstName} ${input.prospect.lastName}`.trim();
  const repFull = `${input.partnerRep.firstName} ${input.partnerRep.lastName}`.trim();
  const dealName = `${prospectFull} — ${input.partnerName}`;
  const subject = `New partner deal registration — ${dealName}`;

  const dealLink =
    input.dealId && input.portalId
      ? `https://app.hubspot.com/contacts/${encodeURIComponent(input.portalId)}/record/0-3/${encodeURIComponent(input.dealId)}`
      : undefined;

  const htmlContent = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;">
<h2 style="margin:0 0 12px;">New partner deal registration</h2>
<p style="margin:0 0 16px;">A partner submitted a deal registration through the CleanStart website${dealLink ? ' and it was created as a deal in HubSpot' : ''}. Review the details below and assign an owner to follow up.</p>
<table style="border-collapse:collapse;">
${row('Deal', dealName)}
${row('Partner', input.partnerName)}
${row('Partner rep', repFull)}
${row('Rep email', input.partnerRep.email)}
${row('Rep phone', input.partnerRep.phone)}
${row('Prospect', prospectFull)}
${row('Prospect email', input.prospect.email)}
${row('Prospect phone', input.prospect.phone)}
</table>
${input.dealDetails && input.dealDetails.trim().length > 0 ? `<h3 style="margin:20px 0 6px;">Deal details</h3><p style="white-space:pre-wrap;margin:0;">${escapeHtml(input.dealDetails)}</p>` : ''}
${dealLink ? `<p style="margin:20px 0 0;"><a href="${dealLink}" style="display:inline-block;background:#1e3eb8;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;">Open the deal in HubSpot</a></p>` : ''}
</body></html>`;

  return { subject, htmlContent };
};
