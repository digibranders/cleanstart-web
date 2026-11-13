/**
 * The one HTML shell every portal email renders into. Same conventions as the CMS email layout, built here so the
 * portal imports nothing from the CMS: a caller describes content as blocks, this owns presentation.
 *
 *  - Tables, not flex or grid: Outlook on Windows renders through Word, which supports neither.
 *  - Inline styles: Gmail strips <style> in several contexts, so <head> holds only media queries and a dark mode fix.
 *  - A preheader on every email, the grey preview line after the subject. Left unset, clients scrape the logo alt text.
 *  - Buttons are padded table cells, the only construct that renders as a button in every major client.
 *  - Every string is HTML escaped here, once. Builders pass raw text.
 */

const BRAND = {
  blue: '#3960f9',
  heading: '#0f172a',
  text: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  border: '#e2e8f0',
  canvas: '#f1f5f9',
  white: '#ffffff',
} as const;

/** Arial renders the same in Outlook, Gmail and Apple Mail. */
const FONT = 'Arial,Helvetica,sans-serif';
const LOGO_URL = 'https://cdn.cleanstart.com/web/emails/logo-email.png';
const SITE_URL = 'https://www.cleanstart.com';
const COMPANY_ADDRESS = 'CleanStart Inc. · 16192 Coastal Highway, Lewes, Delaware 19958, US';

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Only http and https survive, so a caller can never put a `javascript:` URL in a button. */
const safeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export type EmailBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'button'; label: string; url: string }
  | { type: 'facts'; rows: Array<{ label: string; value: string }> }
  | { type: 'note'; text: string };

const paragraph = (text: string): string =>
  `<p class="cs-text" style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${BRAND.text};">${escapeHtml(text)}</p>`;

const facts = (rows: Array<{ label: string; value: string }>): string => {
  const cells = rows
    .filter((row) => row.value.trim().length > 0)
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 16px 8px 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${BRAND.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${BRAND.text};vertical-align:top;white-space:pre-wrap;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join('');
  if (cells.length === 0) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 20px;width:100%;">${cells}</table>`;
};

const button = (label: string, url: string): string => {
  const href = safeUrl(url);
  if (!href) return '';
  // Padding sits on the cell, not the anchor: Word based Outlook handles padding on inline elements badly.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;border-collapse:separate;">
    <tr><td class="cs-btn" align="center" bgcolor="${BRAND.blue}" style="padding:14px 28px;border-radius:8px;mso-padding-alt:14px 28px;">
      <a href="${escapeHtml(href)}" target="_blank" rel="noopener" style="font-family:${FONT};font-size:16px;font-weight:bold;line-height:1;color:${BRAND.white};text-decoration:none;display:block;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
};

const note = (text: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
    <tr><td bgcolor="${BRAND.canvas}" style="padding:14px 16px;border-radius:8px;font-family:${FONT};font-size:14px;line-height:1.5;color:${BRAND.muted};white-space:pre-wrap;">${escapeHtml(text)}</td></tr>
  </table>`;

const renderBlock = (block: EmailBlock): string => {
  switch (block.type) {
    case 'paragraph':
      return paragraph(block.text);
    case 'button':
      return button(block.label, block.url);
    case 'facts':
      return facts(block.rows);
    case 'note':
      return note(block.text);
  }
};

/** Returns the full HTML document. */
export function renderEmail(input: { preheader: string; heading: string; blocks: EmailBlock[]; footnote?: string }): string {
  const body = input.blocks.map(renderBlock).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(input.heading)}</title>
<style>
  :root { color-scheme: light; supported-color-schemes: light; }
  table, td, div, p, a { font-family: ${FONT} !important; }
  /* Outlook.com and the new Outlook rewrite colours in dark mode. Pin the card, its text and the button back. */
  [data-ogsc] .cs-card, [data-ogsb] .cs-card { background-color: ${BRAND.white} !important; }
  [data-ogsc] .cs-heading { color: ${BRAND.heading} !important; }
  [data-ogsc] .cs-text { color: ${BRAND.text} !important; }
  [data-ogsc] .cs-btn, [data-ogsb] .cs-btn { background-color: ${BRAND.blue} !important; }
  [data-ogsc] .cs-btn a { color: ${BRAND.white} !important; }
  @media only screen and (max-width:620px){
    .cs-wrap{width:100% !important;}
    .cs-pad{padding-left:22px !important;padding-right:22px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${BRAND.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.canvas};opacity:0;">${escapeHtml(input.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.canvas};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="cs-wrap cs-card" bgcolor="${BRAND.white}" style="width:600px;max-width:600px;background-color:${BRAND.white};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
    <tr><td class="cs-pad" style="padding:28px 32px 20px;">
      <a href="${SITE_URL}" target="_blank" rel="noopener" style="text-decoration:none;">
        <img src="${LOGO_URL}" alt="CleanStart" width="140" style="display:inline-block;width:140px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
      </a>
    </td></tr>
    <tr><td class="cs-pad" style="padding:0 32px 28px;">
      <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.blue};">Partner Portal</p>
      <h1 class="cs-heading" style="margin:0 0 18px;font-family:${FONT};font-size:22px;line-height:1.35;font-weight:700;color:${BRAND.heading};">${escapeHtml(input.heading)}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:0 32px;">
      <div style="height:1px;background-color:${BRAND.border};line-height:1px;font-size:1px;">&nbsp;</div>
    </td></tr>
    <tr><td align="center" class="cs-pad" style="padding:18px 32px 26px;">
      ${input.footnote ? `<p style="margin:0 0 12px;font-family:${FONT};font-size:12px;line-height:1.5;color:${BRAND.faint};">${escapeHtml(input.footnote)}</p>` : ''}
      <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.5;color:${BRAND.faint};">${escapeHtml(COMPANY_ADDRESS)}</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
