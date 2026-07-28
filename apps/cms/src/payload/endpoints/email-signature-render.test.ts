import { describe, expect, it, vi } from 'vitest';

import { emailSignatureRenderEndpoint } from './email-signature-render';

const TEMPLATE = [
  '<table><tr>',
  '<td><p>{{name}}</p><p>{{jobTitle}}</p></td>',
  '<td>',
  '<a href="mailto:{{email}}">{{email}}</a>',
  '<a href="tel:{{phoneHref}}">{{phone}}</a>',
  '</td>',
  '</tr></table>',
].join('');

const signature = {
  id: 1,
  slug: 'nilesh-jain',
  name: 'Nilesh Jain',
  jobTitle: 'Co-founder & CEO',
  email: 'nilesh.jain@cleanstart.com',
  phoneE164: '+6585117124',
  phoneDisplay: '+65-85117124',
  active: true,
  template: { html: TEMPLATE, _status: 'published' },
};

const call = async (
  slug: unknown,
  docs: unknown[],
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const req = {
    routeParams: { slug },
    payload: {
      find: vi.fn().mockResolvedValue({ docs }),
      logger: { error: vi.fn() },
    },
  };
  // biome-ignore lint/suspicious/noExplicitAny: minimal PayloadRequest stub
  const res = await emailSignatureRenderEndpoint.handler(req as any);
  return { status: res.status, body: await res.json() };
};

describe('GET /api/emailSignatures/:slug/render', () => {
  describe('a signature that renders', () => {
    it('substitutes every placeholder', async () => {
      const { status, body } = await call('nilesh-jain', [signature]);
      expect(status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.html).toBe(
        '<table><tr>' +
          '<td><p>Nilesh Jain</p><p>Co-founder &amp; CEO</p></td>' +
          '<td>' +
          '<a href="mailto:nilesh.jain@cleanstart.com">nilesh.jain@cleanstart.com</a>' +
          '<a href="tel:+6585117124">+65-85117124</a>' +
          '</td>' +
          '</tr></table>',
      );
    });

    it('leaves no unsubstituted placeholder in the output', async () => {
      const { body } = await call('nilesh-jain', [signature]);
      expect(body.html).not.toContain('{{');
    });

    it('escapes the ampersand in a job title so the markup stays valid', async () => {
      const { body } = await call('nilesh-jain', [signature]);
      expect(body.html).toContain('Co-founder &amp; CEO');
    });

    it('returns the display fields the directory needs', async () => {
      const { body } = await call('nilesh-jain', [signature]);
      expect(body.name).toBe('Nilesh Jain');
      expect(body.jobTitle).toBe('Co-founder & CEO');
    });

    it('only queries active signatures', async () => {
      const req = {
        routeParams: { slug: 'nilesh-jain' },
        payload: { find: vi.fn().mockResolvedValue({ docs: [signature] }), logger: { error: vi.fn() } },
      };
      // biome-ignore lint/suspicious/noExplicitAny: minimal PayloadRequest stub
      await emailSignatureRenderEndpoint.handler(req as any);
      const where = req.payload.find.mock.calls[0]?.[0]?.where;
      expect(JSON.stringify(where)).toContain('"active"');
    });
  });

  describe('rejected inputs and states', () => {
    it('400s a missing slug', async () => {
      const { status, body } = await call(undefined, []);
      expect(status).toBe(400);
      expect(body.error).toBe('missing_slug');
    });

    it('404s an unknown or deactivated signature', async () => {
      const { status, body } = await call('someone-who-left', []);
      expect(status).toBe(404);
      expect(body.error).toBe('not_found');
    });

    it('409s when the template relationship did not populate', async () => {
      const { status, body } = await call('nilesh-jain', [{ ...signature, template: 7 }]);
      expect(status).toBe(409);
      expect(body.error).toBe('template_unavailable');
    });

    it('409s rather than serving an unpublished draft template', async () => {
      const draft = { ...signature, template: { html: TEMPLATE, _status: 'draft' } };
      const { status, body } = await call('nilesh-jain', [draft]);
      expect(status).toBe(409);
      expect(body.error).toBe('template_unavailable');
    });

    it('409s on an empty template body', async () => {
      const empty = { ...signature, template: { html: '   ', _status: 'published' } };
      const { status } = await call('nilesh-jain', [empty]);
      expect(status).toBe(409);
    });

    it('500s without leaking internals when a row bypassed field validation', async () => {
      // Only reachable through the REST API, which skips the E.164 field
      // validator — the renderer refuses rather than emitting a bad tel: href.
      const bad = { ...signature, phoneE164: 'javascript:alert(1)' };
      const { status, body } = await call('nilesh-jain', [bad]);
      expect(status).toBe(500);
      expect(body.error).toBe('render_failed');
      expect(body.message).toBeUndefined();
    });

    it('500s when the template references an unknown placeholder', async () => {
      const typo = {
        ...signature,
        template: { html: '<p>{{jobtitle}}</p>', _status: 'published' },
      };
      const { status, body } = await call('nilesh-jain', [typo]);
      expect(status).toBe(500);
      expect(body.error).toBe('render_failed');
    });
  });
});
