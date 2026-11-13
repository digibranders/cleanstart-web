import { describe, expect, it } from 'vitest';
import { FakeEmailTransport } from './fake';

const to = (email: string) => ({ to: [{ email }], subject: `For ${email}`, htmlContent: '<p>x</p>' });

describe('FakeEmailTransport', () => {
  it('records messages in order and finds them by address, ignoring case', async () => {
    const fake = new FakeEmailTransport();
    await fake.send(to('A@example.com'));
    await fake.send(to('b@example.com'));
    expect(fake.sent.map((m) => m.subject)).toEqual(['For A@example.com', 'For b@example.com']);
    expect(fake.to('a@EXAMPLE.com')).toHaveLength(1);
    expect(fake.only('b@example.com').subject).toBe('For b@example.com');
  });

  it('only() throws unless exactly one message went to the address', async () => {
    const fake = new FakeEmailTransport();
    expect(() => fake.only('a@example.com')).toThrow('expected exactly one email to a@example.com, found 0');
    await fake.send(to('a@example.com'));
    await fake.send(to('a@example.com'));
    expect(() => fake.only('a@example.com')).toThrow('found 2');
  });

  it('fails once when failNext is set, then recovers, and clear() resets', async () => {
    const fake = new FakeEmailTransport();
    fake.failNext = 'boom';
    expect(await fake.send(to('a@example.com'))).toEqual({ status: 'failed', error: 'boom' });
    expect(fake.sent).toHaveLength(0);
    expect((await fake.send(to('a@example.com'))).status).toBe('sent');
    fake.clear();
    expect(fake.sent).toEqual([]);
  });
});
