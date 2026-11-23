import { describe, expect, it } from 'vitest';
import type { DocumentListItemDto } from '@/lib/dto';
import { docIcon, docMeta } from './overview';

describe('new document rows', () => {
  const doc = (over: Partial<DocumentListItemDto>): DocumentListItemDto => ({
    id: 'd', title: 'T', type: 'datasheet', product: 'all', summary: null, durationMinutes: null, fileSize: 1, mime: 'application/pdf',
    originalName: 't.pdf', version: 1, updatedAt: '2026-10-30T09:00:00.000Z', hasPoster: false, hasCaptions: false, ...over,
  });
  it('writes the type, the length of a video and the date', () => {
    expect(docMeta(doc({ type: 'video', durationMinutes: 14, updatedAt: '2026-11-04T09:00:00.000Z' }))).toBe('Video, 14 min, 4 Nov');
    expect(docMeta(doc({ type: 'solution_sheet' }))).toBe('Solution sheet, 30 Oct');
    expect(docMeta(doc({ type: 'video', durationMinutes: null }))).toBe('Video, 30 Oct');
  });
  it('shows a play icon for a video and a file icon for everything else', () => {
    expect(docIcon(doc({ type: 'video' }))).toBe('play');
    expect(docIcon(doc({ type: 'battlecard' }))).toBe('file');
  });
});
