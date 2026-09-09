/**
 * The one HTML shell every CleanStart email renders into.
 *
 * Before this, each builder hand-wrote its own `<body style="font-family:Arial">`,
 * so the four emails the site sends looked like four different companies. A
 * caller now describes *content* as blocks and this owns *presentation*.
 *
 * Email HTML is not web HTML, and the constraints below are deliberate:
 *
 *  - **Tables, not flex or grid.** Outlook on Windows renders through Word,
 *    which supports neither, plus no `float` and no `max-width` on divs.
 *  - **Inline styles.** Gmail strips `<style>` blocks in several contexts, so
 *    the only rules in `<head>` are media queries, which are a progressive
 *    enhancement rather than load-bearing.
 *  - **A preheader.** The grey preview line after the subject in most inboxes.
 *    Left unset, clients scrape the first body text, which is usually the logo
 *    alt text. It measurably moves open rates, so every email sets one.
 *  - **Wordmark as text next to the logo.** Most clients block images by
 *    default on first receipt; the brand still reads when the image does not
 *    load, and the logo carries alt text for the same reason.
 *  - **Buttons are table cells, not styled anchors.** A padded, background
 *    coloured `<td>` is the only construct that renders as a button in every
 *    major client. Outlook squares off the corners, which is expected.
 */

/**
 * Taken from the three templates already live in Brevo, so code-built mail and
 * dashboard-built mail are the same design rather than two houses. Slate scale
 * plus the brand blue.
 */
const BRAND = {
  blue: '#3960f9',
  tint: '#eef2ff',
  heading: '#0f172a',
  text: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  border: '#e2e8f0',
  canvas: '#f1f5f9',
  panel: '#f8fafc',
  white: '#ffffff',
} as const;

/**
 * Arial, not a system-ui stack: the live templates force it, and it is the one
 * family that renders identically across Outlook, Gmail and Apple Mail.
 */
const FONT = 'Arial,Helvetica,sans-serif';
/**
 * The wordmark on an opaque white plate (see scripts/upload-email-logo.ts).
 * The bare `emails/social-icons/cleanstart-logo.png` is a dark mark on a 73%
 * transparent background, so it disappears in the clients that invert the card
 * in dark mode. Plated, it backs itself.
 */
const LOGO_URL = 'https://cdn.cleanstart.com/web/emails/logo-email.png';
const SITE_URL = 'https://www.cleanstart.com';

const SOCIAL: ReadonlyArray<{ label: string; href: string; icon: string }> = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/cleanstart-official/',
    icon: 'https://cdn.cleanstart.com/emails/social-icons/icon-linkedin.png',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/cleanstart-dev',
    icon: 'https://cdn.cleanstart.com/emails/social-icons/icon-github.png',
  },
];

/** Postal address in the footer is a CAN-SPAM requirement for commercial mail. */
const COMPANY_ADDRESS = 'CleanStart Inc. \u00b7 16192 Coastal Highway, Lewes, Delaware 19958, US';

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Only http(s) survives, so a caller can never emit a `javascript:` href. */
const safeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export type EmailBlock =
  /** Body copy. `muted` drops it to secondary grey for sign-offs. */
  | { kind: 'paragraph'; text: string; muted?: boolean }
  /** Label/value pairs for a submission summary. Blank values are dropped. */
  | { kind: 'details'; rows: ReadonlyArray<readonly [string, string | undefined | null]> }
  /** Verbatim visitor input, kept visually distinct from our own words. */
  | { kind: 'quote'; label?: string; text: string }
  /** The single primary action. */
  | { kind: 'button'; label: string; url: string }
  /** Tinted aside for a caveat, e.g. a link expiry. */
  | { kind: 'note'; text: string }
  | { kind: 'divider' };

const paragraph = (text: string, muted = false): string =>
  `<p class="${muted ? 'cs-muted' : 'cs-text'}" style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${muted ? BRAND.muted : BRAND.text};">${escapeHtml(text)}</p>`;

const details = (rows: ReadonlyArray<readonly [string, string | undefined | null]>): string => {
  const cells = rows
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 16px 8px 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${BRAND.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${BRAND.text};vertical-align:top;">${escapeHtml(String(value))}</td>
        </tr>`,
    )
    .join('');
  if (cells.length === 0) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 20px;width:100%;">${cells}</table>`;
};

const quote = (text: string, label?: string): string =>
  `${label ? `<p style="margin:0 0 6px;font-family:${FONT};font-size:13px;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(label)}</p>` : ''}
   <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
     <tr><td style="border-left:3px solid ${BRAND.blue};padding:4px 0 4px 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${BRAND.text};white-space:pre-wrap;">${escapeHtml(text)}</td></tr>
   </table>`;

const button = (label: string, url: string): string => {
  const href = safeUrl(url);
  if (!href) return '';
  // Padding sits on the cell, not the anchor: Word-based Outlook ignores
  // display:inline-block and handles padding on inline elements unreliably, so
  // an anchor-padded button collapses there into coloured text.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;border-collapse:separate;">
    <tr><td class="cs-btn" align="center" bgcolor="${BRAND.blue}" style="padding:14px 28px;border-radius:8px;mso-padding-alt:14px 28px;">
      <a href="${escapeHtml(href)}" target="_blank" rel="noopener" style="font-family:${FONT};font-size:16px;font-weight:bold;line-height:1;color:${BRAND.white};text-decoration:none;display:block;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
};

const note = (text: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
    <tr><td bgcolor="${BRAND.canvas}" style="padding:14px 16px;border-radius:8px;font-family:${FONT};font-size:14px;line-height:1.5;color:${BRAND.muted};">${escapeHtml(text)}</td></tr>
  </table>`;

const divider = (): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;"><tr><td style="border-top:1px solid ${BRAND.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;

const renderBlock = (block: EmailBlock): string => {
  switch (block.kind) {
    case 'paragraph':
      return paragraph(block.text, block.muted ?? false);
    case 'details':
      return details(block.rows);
    case 'quote':
      return quote(block.text, block.label);
    case 'button':
      return button(block.label, block.url);
    case 'note':
      return note(block.text);
    case 'divider':
      return divider();
  }
};

export interface RenderEmailOptions {
  /** Inbox preview line. Write it as a real sentence: it is read before the body. */
  preheader: string;
  /** Small category label above the heading, e.g. "Partnerships", "Careers". */
  eyebrow?: string;
  heading: string;
  blocks: readonly EmailBlock[];
  /** Closing line above the address, e.g. why this email was received. */
  footerNote?: string;
}

export const renderEmail = ({
  preheader,
  eyebrow,
  heading,
  blocks,
  footerNote,
}: RenderEmailOptions): string => {
  const body = blocks.map(renderBlock).join('\n');
  const social = SOCIAL.map(
    (item) =>
      `<td style="padding:0 8px;"><a href="${item.href}" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none;"><img src="${item.icon}" width="24" height="24" alt="${item.label}" style="display:block;border:0;outline:none;text-decoration:none;width:24px;height:24px;-ms-interpolation-mode:bicubic;"></a></td>`,
  ).join('');

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(heading)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
  :root { color-scheme: light; supported-color-schemes: light; }
  table, td, div, p, a { font-family: ${FONT} !important; }

  /* Outlook.com and the new Outlook rewrite colours in dark mode and stamp
     [data-ogsc] (text) / [data-ogsb] (background) on what they changed. Pinning
     the card, its text and the button back stops the half-inverted result where
     a dark heading lands on a dark card. Outlook on Windows uses the Word
     engine, ignores all of this, and inverts wholesale: the layout stays
     legible there because the logo carries its own light plate and the button
     keeps an explicit bgcolor. */
  [data-ogsc] .cs-card, [data-ogsb] .cs-card { background-color: ${BRAND.white} !important; }
  [data-ogsc] .cs-heading { color: ${BRAND.heading} !important; }
  [data-ogsc] .cs-text { color: ${BRAND.text} !important; }
  [data-ogsc] .cs-muted, [data-ogsc] .cs-faint { color: ${BRAND.muted} !important; }
  [data-ogsc] .cs-btn, [data-ogsb] .cs-btn { background-color: ${BRAND.blue} !important; }
  [data-ogsc] .cs-btn a { color: ${BRAND.white} !important; }

  @media only screen and (max-width:620px){
    .cs-wrap{width:100% !important;}
    .cs-pad{padding-left:22px !important;padding-right:22px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${BRAND.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!-- Preheader: shown in the inbox list, never in the open email. The trailing
     entities stop clients padding the preview with body text. -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.canvas};opacity:0;">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.canvas};">
<tr><td align="center" style="padding:32px 12px;">

  <!-- Header, body and footer share one card. The footer is separated by a
       hairline rule rather than floating on the page background, matching the
       templates already live in Brevo. -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="cs-wrap cs-card" bgcolor="${BRAND.white}" style="width:600px;max-width:600px;background-color:${BRAND.white};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">

    <tr><td class="cs-pad" style="padding:28px 32px 20px;">
      <a href="${SITE_URL}" target="_blank" rel="noopener" style="text-decoration:none;">
        <img src="${LOGO_URL}" alt="CleanStart" width="140" style="display:inline-block;width:140px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
      </a>
    </td></tr>

    <tr><td class="cs-pad" style="padding:0 32px 28px;">
      ${eyebrow ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.blue};">${escapeHtml(eyebrow)}</p>` : ''}
      <h1 class="cs-heading" style="margin:0 0 18px;font-family:${FONT};font-size:22px;line-height:1.35;font-weight:700;color:${BRAND.heading};">${escapeHtml(heading)}</h1>
      ${body}
    </td></tr>

    <tr><td style="padding:0 32px;">
      <div style="height:1px;background-color:${BRAND.border};line-height:1px;font-size:1px;">&nbsp;</div>
    </td></tr>

    <tr><td align="center" class="cs-pad" style="padding:18px 32px 26px;">
      ${footerNote ? `<p style="margin:0 0 14px;font-family:${FONT};font-size:12px;line-height:1.5;color:${BRAND.faint};">${escapeHtml(footerNote)}</p>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px;border-collapse:collapse;"><tr>${social}</tr></table>
      <!-- Postal address is a CAN-SPAM requirement. No unsubscribe link: these
           are transactional confirmations, not marketing. -->
      <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.5;color:${BRAND.faint};">${escapeHtml(COMPANY_ADDRESS)}</p>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
};
