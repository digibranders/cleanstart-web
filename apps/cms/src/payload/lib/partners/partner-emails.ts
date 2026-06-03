export type PartnerEmailInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  company: string;
  website?: string | undefined;
  partnerReason?: string | undefined;
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
    ? `<tr><td style="padding:4px 12px 4px 0;color:#555;font-weight:600;">${label}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`
    : '';

/** Internal admin notification — all submitted details. */
export const buildPartnerAdminEmail = (
  input: PartnerEmailInput,
): { subject: string; htmlContent: string } => {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const subject = `New partner inquiry — ${input.company} — ${fullName}`;
  const htmlContent = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;">
<h2 style="margin:0 0 12px;">New partner inquiry</h2>
<p style="margin:0 0 16px;"><strong>${escapeHtml(fullName)}</strong> from <strong>${escapeHtml(input.company)}</strong> wants to partner with CleanStart.</p>
<table style="border-collapse:collapse;">
${row('Name', fullName)}
${row('Email', input.email)}
${row('Phone', input.phone)}
${row('Company', input.company)}
${row('Website', input.website)}
</table>
${input.partnerReason && input.partnerReason.trim().length > 0 ? `<h3 style="margin:20px 0 6px;">Why partner</h3><p style="white-space:pre-wrap;margin:0;">${escapeHtml(input.partnerReason)}</p>` : ''}
</body></html>`;
  return { subject, htmlContent };
};

/** Applicant confirmation — friendly acknowledgement. */
export const buildPartnerApplicantEmail = (
  input: PartnerEmailInput,
): { subject: string; htmlContent: string } => {
  const subject = 'Thanks for your interest in partnering with CleanStart';
  const htmlContent = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6;">
<h2 style="margin:0 0 12px;">Thanks, ${escapeHtml(input.firstName)}!</h2>
<p style="margin:0 0 12px;">We've received your partnership inquiry for <strong>${escapeHtml(input.company)}</strong>. Our partnerships team will review it and get back to you shortly.</p>
<p style="margin:0;color:#555;">— The CleanStart team</p>
</body></html>`;
  return { subject, htmlContent };
};
