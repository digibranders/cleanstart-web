import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { fmtLong } from '@/lib/dates';
import { countryName, formatDealValue } from '@/lib/deal-format';
import { EXTENSION_DAYS, PROTECTION_DAYS, REVIEW_SLA_BUSINESS_DAYS } from '@/lib/deal-rules';
import { PARTNER_REGION_LABEL, PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';

/** Everything the page prints, already resolved: dates are ISO, labels are display text. */
export interface RegistrationConfirmationDto {
  reference: string;
  customer: string;
  website: string | null;
  country: string | null;
  product: string;
  region: string;
  partnerName: string;
  registeredOn: string;
  acceptedOn: string;
  protectedFrom: string;
  protectedUntil: string;
  extension: { days: number; grantedOn: string | null } | null;
  managerName: string | null;
  dealValue: string | null;
  generatedOn: string;
}

/** Null when the registration is not accepted or lacks the dates the page needs. */
export function toConfirmationDto(deal: RegistrationDetailDto, today: string): RegistrationConfirmationDto | null {
  if (deal.status !== 'accepted' || !deal.decidedOn || !deal.protectionEnd) return null;
  const extended = deal.extensionStatus === 'granted' && deal.extensionDays;
  return {
    reference: deal.reference,
    customer: deal.customer,
    website: deal.website,
    country: countryName(deal.customerCountry),
    product: PRODUCT_LABEL[deal.product],
    region: PARTNER_REGION_LABEL[deal.region],
    partnerName: deal.partnerName,
    registeredOn: deal.registeredOn,
    acceptedOn: deal.decidedOn,
    protectedFrom: deal.decidedOn,
    protectedUntil: deal.protectionEnd,
    extension: extended ? { days: deal.extensionDays ?? EXTENSION_DAYS, grantedOn: deal.extensionGrantedAt?.slice(0, 10) ?? null } : null,
    managerName: deal.managerName,
    dealValue: deal.dealValue === null ? null : formatDealValue(deal.dealValue, deal.currency, 'code'),
    generatedOn: today,
  };
}

const INK = rgb(0.1, 0.1, 0.14);
const MUTED = rgb(0.42, 0.43, 0.5);
const VIOLET = rgb(0.38, 0.22, 0.82);
const RULE = rgb(0.88, 0.88, 0.92);
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 56;
const LABEL_W = 150;

/** Standard fonts hold Latin-1 only; anything else prints as "?" instead of failing the download. */
const encodable = (font: PDFFont, text: string): string => {
  const set = new Set(font.getCharacterSet());
  return Array.from(text.replace(/[\r\n\t]+/g, ' '))
    .map((ch) => (set.has(ch.codePointAt(0) ?? 0) ? ch : '?'))
    .join('');
};

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** One A4 page. Pure: the same DTO always yields the same bytes (dates come from the DTO, not the clock). */
export async function renderRegistrationConfirmation(dto: RegistrationConfirmationDto): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  const date = new Date(`${dto.generatedOn}T00:00:00Z`);
  doc.setTitle(`Deal registration confirmation ${dto.reference}`);
  doc.setProducer('CleanStart Partner Portal');
  doc.setCreator('CleanStart Partner Portal');
  doc.setCreationDate(date);
  doc.setModificationDate(date);
  const page: PDFPage = doc.addPage([PAGE.width, PAGE.height]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const contentW = PAGE.width - MARGIN * 2;
  let y = PAGE.height - MARGIN;

  const text = (value: string, x: number, size: number, font: PDFFont, color = INK): void => {
    page.drawText(encodable(font, value), { x, y, size, font, color });
  };

  text('CleanStart', MARGIN, 18, bold, VIOLET);
  text('Partner Portal', MARGIN + bold.widthOfTextAtSize('CleanStart', 18) + 8, 11, regular, MUTED);
  y -= 56;
  text('Deal registration confirmation', MARGIN, 24, bold);
  y -= 24;
  text(dto.reference, MARGIN, 13, regular, VIOLET);
  y -= 30;

  const rows: Array<[string, string]> = [['Customer', dto.customer]];
  if (dto.website) rows.push(['Website', dto.website]);
  if (dto.country) rows.push(['Country', dto.country]);
  rows.push(['Product', dto.product], ['Region', dto.region], ['Partner company', dto.partnerName]);
  if (dto.managerName) rows.push(['Partner manager', dto.managerName]);
  if (dto.dealValue) rows.push(['Deal value', dto.dealValue]);
  rows.push(
    ['Registered on', fmtLong(dto.registeredOn)],
    ['Accepted on', fmtLong(dto.acceptedOn)],
    ['Protected from', fmtLong(dto.protectedFrom)],
    ['Protected until', fmtLong(dto.protectedUntil)],
  );
  for (const [label, value] of rows) {
    page.drawLine({ start: { x: MARGIN, y: y + 15 }, end: { x: MARGIN + contentW, y: y + 15 }, thickness: 0.5, color: RULE });
    text(label, MARGIN, 10, regular, MUTED);
    const lines = wrap(bold, encodable(bold, value), 11, contentW - LABEL_W);
    for (const [index, line] of lines.entries()) {
      text(line, MARGIN + LABEL_W, 11, bold);
      if (index < lines.length - 1) y -= 15;
    }
    y -= 26;
  }
  if (dto.extension) {
    const when = dto.extension.grantedOn ? `, granted on ${fmtLong(dto.extension.grantedOn)}` : '';
    text(`Includes a ${dto.extension.days} day extension${when}.`, MARGIN + LABEL_W, 10, regular, MUTED);
    y -= 26;
  }

  y -= 8;
  text('About protection', MARGIN, 12, bold);
  y -= 20;
  const about =
    `Protection runs ${PROTECTION_DAYS} days from the day CleanStart accepts a registration. ` +
    `One ${EXTENSION_DAYS} day extension can be requested before it ends. ` +
    `CleanStart decides each registration within ${REVIEW_SLA_BUSINESS_DAYS} business days.`;
  for (const line of wrap(regular, about, 10.5, contentW)) {
    text(line, MARGIN, 10.5, regular);
    y -= 15;
  }

  y = MARGIN + 13;
  text(`Generated on ${fmtLong(dto.generatedOn)}`, MARGIN, 9, regular, MUTED);
  y = MARGIN;
  text('This confirmation is generated by the CleanStart Partner Portal and does not replace the partner agreement.', MARGIN, 9, regular, MUTED);

  return doc.save({ useObjectStreams: false });
}
