import { describe, expect, it } from 'vitest';
import type { EmailMessage } from '../transport';

/** Gives a builder either the real sample text or a marker `<b>field</b>` that must come out escaped. */
export type Field = (name: string, real: string) => string;

export interface TemplateCase {
  name: string;
  build: (f: Field) => EmailMessage;
  /** Expected subject when the builder gets the real sample text. */
  subject: string;
  /** Plain text that must appear in the body (after HTML escaping of the sample text). */
  contains: string[];
  /** Expected recipients. */
  to: string[];
  replyTo?: string;
}

const textNodes = (html: string): string => html.replace(/<style>[\s\S]*?<\/style>/, '');

/** The checks every template passes: escaping of each field, no header injection, agreed copy, clean punctuation. */
export function describeTemplates(cases: TemplateCase[]): void {
  describe.each(cases)('$name', (testCase) => {
    it('escapes every free text field a visitor can fill in', () => {
      const used: string[] = [];
      const message = testCase.build((name) => {
        used.push(name);
        return `<b>${name}</b>`;
      });
      expect(used.length).toBeGreaterThan(0);
      expect(message.htmlContent).not.toContain('<b>');
      for (const name of new Set(used)) {
        expect(message.htmlContent, `field ${name}`).toContain(`&lt;b&gt;${name}&lt;/b&gt;`);
      }
    });

    it('escapes a name that carries a script tag', () => {
      const message = testCase.build(() => '<script>alert(1)</script>');
      expect(message.htmlContent).not.toMatch(/<script/i);
      expect(message.htmlContent).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('keeps a line break out of the subject', () => {
      const message = testCase.build((name) => `${name}\r\nBcc: attacker@example.com`);
      expect(message.subject).not.toMatch(/[\r\n]/);
    });

    it('has the agreed subject, recipients and copy', () => {
      const message = testCase.build((_name, real) => real);
      expect(message.subject).toBe(testCase.subject);
      expect(message.to.map((address) => address.email)).toEqual(testCase.to);
      expect(message.replyTo?.email).toBe(testCase.replyTo);
      for (const text of testCase.contains) expect(message.htmlContent).toContain(text);
    });

    it('has no dashes and no exclamation marks in the copy', () => {
      const message = testCase.build((_name, real) => real);
      expect(`${message.subject}${message.htmlContent}`).not.toMatch(/[\u2013\u2014]/);
      expect(message.subject).not.toContain('!');
      expect(textNodes(message.htmlContent)).not.toMatch(/>[^<]*!/);
    });
  });
}
