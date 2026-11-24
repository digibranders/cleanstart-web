import { describe, expect, it } from 'vitest';
import {
  CHAT_FILE_MAX_BYTES,
  checkChatFile,
  matchSlash,
  muteUntil,
  parseSlash,
  previewOf,
  segmentBody,
  tickState,
} from './chat';

describe('tickState', () => {
  it('is sent with nobody else in the chat', () => expect(tickState(3, [])).toBe('sent'));
  it('is delivered once every other device has it, seen once every other person read it', () => {
    expect(tickState(3, [{ lastReadSeq: 0, lastDeliveredSeq: 3 }, { lastReadSeq: 0, lastDeliveredSeq: 0 }])).toBe('sent');
    expect(tickState(3, [{ lastReadSeq: 0, lastDeliveredSeq: 3 }, { lastReadSeq: 1, lastDeliveredSeq: 3 }])).toBe('delivered');
    expect(tickState(3, [{ lastReadSeq: 3, lastDeliveredSeq: 3 }, { lastReadSeq: 2, lastDeliveredSeq: 3 }])).toBe('delivered');
    expect(tickState(3, [{ lastReadSeq: 3, lastDeliveredSeq: 3 }, { lastReadSeq: 5, lastDeliveredSeq: 5 }])).toBe('seen');
  });
  it('counts a read position as delivered even if delivery lagged', () => {
    expect(tickState(2, [{ lastReadSeq: 2, lastDeliveredSeq: 0 }])).toBe('seen');
  });
});

describe('parseSlash and matchSlash', () => {
  it('parses a known command with its arguments', () => {
    expect(parseSlash('/deal vardhan capital')).toEqual({ name: 'deal', args: 'vardhan capital' });
    expect(parseSlash('/pin')).toEqual({ name: 'pin', args: '' });
    expect(parseSlash('  /mute 1h ')).toEqual({ name: 'mute', args: '1h' });
  });
  it('leaves everything else as plain text, so a pasted path is never eaten', () => {
    expect(parseSlash('/usr/local/bin')).toBeNull();
    expect(parseSlash('/nope arg')).toBeNull();
    expect(parseSlash('hello /deal')).toBeNull();
  });
  it('offers commands by prefix only while the name is being typed', () => {
    expect(matchSlash('/').length).toBeGreaterThan(5);
    expect(matchSlash('/de').map((c) => c.name)).toEqual(['deal']);
    expect(matchSlash('/deal x')).toEqual([]);
    expect(matchSlash('deal')).toEqual([]);
  });
});

describe('checkChatFile', () => {
  it('accepts an allowed type inside the limits', () => expect(checkChatFile({ name: 'plan.pdf', size: 1000 }, 0).ok).toBe(true));
  it('refuses an empty file, an oversize file, an unknown type and an eleventh file', () => {
    expect(checkChatFile({ name: 'a.pdf', size: 0 }, 0).ok).toBe(false);
    expect(checkChatFile({ name: 'a.pdf', size: CHAT_FILE_MAX_BYTES + 1 }, 0).message).toMatch(/up to 25 MB/);
    expect(checkChatFile({ name: 'run.exe', size: 10 }, 0).ok).toBe(false);
    expect(checkChatFile({ name: 'logo.svg', size: 10 }, 0).ok).toBe(false);
    expect(checkChatFile({ name: 'a.pdf', size: 10 }, 10).ok).toBe(false);
  });
});

describe('segmentBody', () => {
  it('splits links, inline code and known mentions without losing text', () => {
    const segments = segmentBody('See https://example.com/a, then run `ls -la` @Asha Rao ok', ['Asha Rao']);
    expect(segments.map((s) => [s.kind, s.text])).toEqual([
      ['text', 'See '],
      ['link', 'https://example.com/a'],
      ['text', ', then run '],
      ['code', 'ls -la'],
      ['text', ' '],
      ['mention', '@Asha Rao'],
      ['text', ' ok'],
    ]);
    expect(segments.map((s) => s.text).join('')).not.toContain('`');
  });
  it('never turns an unknown name or an angle bracket into markup', () => {
    expect(segmentBody('<b>hi</b> @Nobody', ['Asha Rao']).every((s) => s.kind === 'text')).toBe(true);
  });
  it('returns plain text unchanged', () => expect(segmentBody('just words', [])).toEqual([{ kind: 'text', text: 'just words' }]));
});

describe('muteUntil and previewOf', () => {
  const now = new Date('2026-11-24T10:00:00Z');
  it('computes the end of a mute, or none for off', () => {
    expect(muteUntil('1h', now)?.toISOString()).toBe('2026-11-24T11:00:00.000Z');
    expect(muteUntil('week', now)?.toISOString()).toBe('2026-12-01T10:00:00.000Z');
    expect(muteUntil('off', now)).toBeNull();
  });
  it('builds a one line preview', () => {
    expect(previewOf({ body: 'a\n\n b', attachments: 0, senderFirstName: 'Asha' })).toBe('Asha: a b');
    expect(previewOf({ body: '', attachments: 2, senderFirstName: 'Asha' })).toBe('Asha: Sent 2 files');
    expect(previewOf({ body: '', attachments: 0, senderFirstName: null, refKind: 'deal' })).toBe('Shared a deal');
    expect(previewOf({ body: 'x'.repeat(200), attachments: 0, senderFirstName: null }).length).toBe(120);
  });
});
