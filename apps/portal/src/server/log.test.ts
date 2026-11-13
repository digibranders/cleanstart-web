import { describe, expect, it } from 'vitest';
import { createLogger, redact } from './log';

const capture = (level: 'debug' | 'info' | 'warn' | 'error' = 'info') => {
  const lines: Array<Record<string, unknown>> = [];
  const logger = createLogger({ level, write: (line) => lines.push(JSON.parse(line) as Record<string, unknown>), now: () => new Date('2026-11-06T14:02:00Z') });
  return { lines, logger };
};

describe('logger', () => {
  it('writes one JSON line with level, time, message and fields', () => {
    const { lines, logger } = capture();
    logger.info({ action: 'registration.accept' }, 'done');
    expect(lines).toEqual([{ level: 'info', time: '2026-11-06T14:02:00.000Z', msg: 'done', action: 'registration.accept' }]);
  });

  it('drops entries below the level', () => {
    const { lines, logger } = capture('warn');
    logger.debug({}, 'a');
    logger.info({}, 'b');
    logger.warn({}, 'c');
    expect(lines.map((l) => l.msg)).toEqual(['c']);
  });

  it('redacts authorization, password, token, cookie and secret keys at any depth', () => {
    const { lines, logger } = capture();
    logger.info({ headers: { Authorization: 'Bearer abc', cookie: 'sid=1', ok: 'yes' }, user: { password: 'p', tokenHash: 'h' }, list: [{ clientSecret: 's' }] }, 'x');
    expect(lines[0]).toMatchObject({
      headers: { Authorization: '[redacted]', cookie: '[redacted]', ok: 'yes' },
      user: { password: '[redacted]', tokenHash: '[redacted]' },
      list: [{ clientSecret: '[redacted]' }],
    });
  });

  it('serialises errors with their cause and caps depth', () => {
    const error = new Error('outer', { cause: new Error('inner') });
    const out = redact(error) as { message: string; cause: { message: string } };
    expect(out.message).toBe('outer');
    expect(out.cause.message).toBe('inner');
    const nest = (levels: number): Record<string, unknown> => (levels === 0 ? {} : { next: nest(levels - 1) });
    expect(JSON.stringify(redact(nest(10)))).toContain('[truncated]');
  });
});
