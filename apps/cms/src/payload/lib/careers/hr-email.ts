export type HrApplicationEmailInput = {
  jobTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  coverLetter?: string | undefined;
  linkedinUrl?: string | undefined;
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

/**
 * Builds the HR-notification subject + HTML for a new application. Self-contained
 * (no Brevo dashboard template). All applicant-supplied values are HTML-escaped.
 */
export const buildHrApplicationEmail = (
  input: HrApplicationEmailInput,
): { subject: string; htmlContent: string } => {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const subject = `New application — ${input.jobTitle} — ${fullName}`;
  const htmlContent = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;">
<h2 style="margin:0 0 12px;">New job application</h2>
<p style="margin:0 0 16px;">A candidate applied for <strong>${escapeHtml(input.jobTitle)}</strong>. Resume attached.</p>
<table style="border-collapse:collapse;">
${row('Name', fullName)}
${row('Email', input.email)}
${row('Phone', input.phone)}
${row('LinkedIn', input.linkedinUrl)}
</table>
${input.coverLetter && input.coverLetter.trim().length > 0 ? `<h3 style="margin:20px 0 6px;">Cover letter</h3><p style="white-space:pre-wrap;margin:0;">${escapeHtml(input.coverLetter)}</p>` : ''}
</body></html>`;
  return { subject, htmlContent };
};
