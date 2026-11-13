import type { EmailMessage, EmailResult, EmailTransport } from './transport';

/** In memory transport for tests. No timers, no network. */
export class FakeEmailTransport implements EmailTransport {
  /** Every message sent, in order. */
  sent: EmailMessage[] = [];
  /** Set to make the next send return { status: 'failed', error } once. */
  failNext: string | null = null;

  async send(message: EmailMessage): Promise<EmailResult> {
    if (this.failNext !== null) {
      const error = this.failNext;
      this.failNext = null;
      return { status: 'failed', error };
    }
    this.sent.push(message);
    return { status: 'sent', messageId: `fake-${this.sent.length}` };
  }

  /** Messages whose `to` includes the address (case insensitive). */
  to(email: string): EmailMessage[] {
    const wanted = email.toLowerCase();
    return this.sent.filter((message) => message.to.some((address) => address.email.toLowerCase() === wanted));
  }

  /** The only message sent to the address; throws when there is not exactly one. */
  only(email: string): EmailMessage {
    const matches = this.to(email);
    const [first] = matches;
    if (matches.length !== 1 || !first) throw new Error(`expected exactly one email to ${email}, found ${matches.length}`);
    return first;
  }

  clear(): void {
    this.sent = [];
    this.failNext = null;
  }
}
