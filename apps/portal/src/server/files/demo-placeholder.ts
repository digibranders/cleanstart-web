import { crc32 } from 'node:zlib';
import { ALLOWED_DOCUMENT_TYPES } from './rules';

const encoder = new TextEncoder();

/** The mime type a seeded key serves, from its extension. */
export const mimeForExtension = (ext: string): string => ALLOWED_DOCUMENT_TYPES.find((type) => type.ext === ext)?.mime ?? 'application/octet-stream';

const concat = (parts: readonly Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

const u32le = (n: number): number[] => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
const u16le = (n: number): number[] => [n & 0xff, (n >>> 8) & 0xff];
const u32be = (n: number): number[] => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

/** Printable ASCII only, with PDF string escapes: a title can hold anything. */
const pdfText = (text: string): string => text.replace(/[^\x20-\x7e]/g, '?').replace(/([\\()])/g, '\\$1');

/** A one page PDF with the title and a note, valid xref included. Same input, same bytes. */
function pdfBytes(title: string, note: string): Uint8Array {
  const stream = `BT /F1 20 Tf 72 720 Td (${pdfText(title)}) Tj ET\nBT /F1 11 Tf 72 690 Td (${pdfText(note)}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return encoder.encode(body);
}

/** A ZIP with one stored README.txt: the signature the upload check wants for pptx, docx, xlsx and zip. */
function zipBytes(text: string): Uint8Array {
  const name = encoder.encode('README.txt');
  const data = encoder.encode(text);
  const crc = crc32(data);
  const common = [...u16le(20), ...u16le(0), ...u16le(0), ...u16le(0x21), ...u16le(0), ...u32le(crc), ...u32le(data.length), ...u32le(data.length), ...u16le(name.length), ...u16le(0)];
  const local = concat([Uint8Array.from([0x50, 0x4b, 0x03, 0x04, ...common]), name, data]);
  const central = concat([Uint8Array.from([0x50, 0x4b, 0x01, 0x02, ...u16le(20), ...common, ...u16le(0), ...u16le(0), ...u16le(0), ...u32le(0), ...u32le(0)]), name]);
  const end = Uint8Array.from([0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, ...u16le(1), ...u16le(1), ...u32le(central.length), ...u32le(local.length), 0, 0]);
  return concat([local, central, end]);
}

/** An MP4 container with the ftyp box and a free box that carries the note. It has no video track. */
function mp4Bytes(note: string): Uint8Array {
  const brand = encoder.encode('isom');
  const ftyp = concat([Uint8Array.from(u32be(24)), encoder.encode('ftyp'), brand, Uint8Array.from(u32be(512)), brand, encoder.encode('mp41')]);
  const text = encoder.encode(note);
  return concat([ftyp, Uint8Array.from(u32be(8 + text.length)), encoder.encode('free'), text]);
}

/**
 * The file a seeded document serves in demo mode: a small placeholder made from the title and the key's extension.
 * Deterministic, so the same document is the same bytes on every instance and every visit.
 */
export function placeholderFile(input: { key: string; title: string }): { contentType: string; bytes: Uint8Array } {
  const ext = input.key.split('.').pop()?.toLowerCase() ?? '';
  const note = 'Placeholder file for the CleanStart partner portal demo.';
  const contentType = mimeForExtension(ext);
  switch (ext) {
    case 'pdf':
      return { contentType, bytes: pdfBytes(input.title, note) };
    case 'mp4':
      return { contentType, bytes: mp4Bytes(`${input.title}. ${note}`) };
    case 'pptx':
    case 'docx':
    case 'xlsx':
    case 'zip':
      return { contentType, bytes: zipBytes(`${input.title}\n${note}\n`) };
    default:
      return { contentType: 'text/plain', bytes: encoder.encode(`${input.title}\n${note}\n`) };
  }
}
