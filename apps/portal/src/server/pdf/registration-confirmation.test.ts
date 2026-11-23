import { inflateSync } from 'node:zlib';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { formatDealValue } from '@/lib/deal-format';
import { type RegistrationConfirmationDto, renderRegistrationConfirmation } from './registration-confirmation';

const dto: RegistrationConfirmationDto = {
  reference: 'REG-2611-0016',
  customer: 'Vardhan Capital',
  website: 'vardhan.example',
  country: 'India',
  product: 'CleanSight',
  region: 'India',
  partnerName: 'Kestrel Systems',
  registeredOn: '2026-11-06',
  acceptedOn: '2026-11-09',
  protectedFrom: '2026-11-09',
  protectedUntil: '2027-02-06',
  extension: null,
  managerName: 'Gaurav Jadhav',
  dealValue: '$120,000',
  generatedOn: '2026-11-23',
};

/** Content streams are Flate compressed; text is drawn as literal or hex strings inside Tj operators. */
function pageText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString('latin1');
  const out: string[] = [];
  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    const body = Buffer.from(match[1] ?? '', 'latin1');
    try {
      out.push(inflateSync(body).toString('latin1'));
    } catch {
      out.push(body.toString('latin1'));
    }
  }
  return out
    .join('\n')
    .replace(/<([0-9A-Fa-f]+)>\s*Tj/g, (_m, hex: string) => `(${Buffer.from(hex, 'hex').toString('latin1')}) Tj`);
}

describe('renderRegistrationConfirmation', () => {
  it('returns a one page A4 PDF', async () => {
    const bytes = await renderRegistrationConfirmation(dto);
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe('%PDF-');
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBe(1);
    expect(parsed.getTitle()).toBe('Deal registration confirmation REG-2611-0016');
    const { width, height } = parsed.getPage(0).getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([595, 842]);
  });

  it('prints the reference, the customer, the dates and the fixed lines', async () => {
    const text = pageText(await renderRegistrationConfirmation(dto));
    for (const expected of [
      'Deal registration confirmation',
      'REG-2611-0016',
      'Vardhan Capital',
      'Kestrel Systems',
      '9 Nov 2026',
      '6 Feb 2027',
      '$120,000',
      'does not replace the partner agreement.',
    ]) {
      expect(text, expected).toContain(expected);
    }
  });

  it('adds the extension line only when an extension was granted, and survives characters outside Latin-1', async () => {
    const plain = pageText(await renderRegistrationConfirmation(dto));
    expect(plain).not.toContain('extension, granted');
    const extended = pageText(
      await renderRegistrationConfirmation({ ...dto, customer: 'Zażółć Ltd 株式会社', extension: { days: 30, grantedOn: '2027-01-20' } }),
    );
    expect(extended).toContain('Includes a 30 day extension, granted on 20 Jan 2027.');
    expect(extended).toContain('Za?');
  });

  it('prints the currency code, because the PDF fonts have no rupee sign', () => {
    expect(formatDealValue(4200000, 'INR', 'code').replace(/\s/g, ' ')).toBe('INR 4,200,000');
  });

  it('is deterministic for the same input', async () => {
    const a = await renderRegistrationConfirmation(dto);
    const b = await renderRegistrationConfirmation(dto);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });
});
