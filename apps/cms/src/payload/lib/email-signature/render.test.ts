import { describe, expect, it } from 'vitest';

import {
  buildTokenValues,
  escapeHtml,
  extractTokens,
  renderSignature,
  SIGNATURE_TOKENS,
  unknownTokens,
} from './render';

const record = {
  name: 'Adrian Lee',
  jobTitle: 'Regional Sales Director, SouthEast Asia',
  email: 'adrian.lee@cleanstart.com',
  phoneE164: '+6596847785',
  phoneDisplay: '+65-96847785',
};

describe('escapeHtml', () => {
  it('escapes the five characters unsafe in text and attribute positions', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('does not double-escape an ampersand it just emitted', () => {
    expect(escapeHtml('Co-founder & CEO')).toBe('Co-founder &amp; CEO');
  });

  it('leaves safe text untouched', () => {
    expect(escapeHtml('Solution Architect')).toBe('Solution Architect');
  });
});

describe('extractTokens', () => {
  it('collects distinct tokens in first-appearance order', () => {
    expect(extractTokens('{{name}} — {{jobTitle}} — {{name}}')).toEqual(['name', 'jobTitle']);
  });

  it('tolerates inner whitespace', () => {
    expect(extractTokens('{{  name  }}')).toEqual(['name']);
  });

  it('returns empty for a template with no tokens', () => {
    expect(extractTokens('<td>Start Clean. Stay Secure.</td>')).toEqual([]);
  });
});

describe('unknownTokens', () => {
  it('flags a token outside the contract', () => {
    expect(unknownTokens('{{name}} {{jobtitle}}')).toEqual(['jobtitle']);
  });

  it('accepts every token in the contract', () => {
    const template = SIGNATURE_TOKENS.map((token) => `{{${token}}}`).join(' ');
    expect(unknownTokens(template)).toEqual([]);
  });
});

describe('buildTokenValues', () => {
  it('maps record fields onto the token contract', () => {
    expect(buildTokenValues(record)).toEqual({
      name: 'Adrian Lee',
      jobTitle: 'Regional Sales Director, SouthEast Asia',
      email: 'adrian.lee@cleanstart.com',
      phone: '+65-96847785',
      phoneHref: '+6596847785',
    });
  });

  it('falls back to the E.164 value when phoneDisplay is blank', () => {
    const values = buildTokenValues({ ...record, phoneDisplay: '   ' });
    expect(values.phone).toBe('+6596847785');
  });

  it('falls back to the E.164 value when phoneDisplay is null', () => {
    const values = buildTokenValues({ ...record, phoneDisplay: null });
    expect(values.phone).toBe('+6596847785');
  });

  it('rejects a non-E.164 phone so nothing unsafe reaches a tel: href', () => {
    expect(() => buildTokenValues({ ...record, phoneE164: '+91 6355 037 994' })).toThrow(
      /E\.164/,
    );
  });

  it('rejects a phone carrying a scheme', () => {
    expect(() => buildTokenValues({ ...record, phoneE164: 'javascript:alert(1)' })).toThrow(
      /E\.164/,
    );
  });
});

describe('renderSignature', () => {
  const templateHtml =
    '<p>{{name}}</p><p>{{jobTitle}}</p>' +
    '<a href="mailto:{{email}}">{{email}}</a>' +
    '<a href="tel:{{phoneHref}}">{{phone}}</a>';

  it('substitutes every token', () => {
    const html = renderSignature({ templateHtml, values: buildTokenValues(record) });
    expect(html).toBe(
      '<p>Adrian Lee</p><p>Regional Sales Director, SouthEast Asia</p>' +
        '<a href="mailto:adrian.lee@cleanstart.com">adrian.lee@cleanstart.com</a>' +
        '<a href="tel:+6596847785">+65-96847785</a>',
    );
  });

  it('escapes an ampersand in a job title so the markup stays valid', () => {
    const html = renderSignature({
      templateHtml: '<p>{{jobTitle}}</p>',
      values: buildTokenValues({ ...record, jobTitle: 'Co-founder & CEO' }),
    });
    expect(html).toBe('<p>Co-founder &amp; CEO</p>');
  });

  it('escapes markup injected through a data field', () => {
    const html = renderSignature({
      templateHtml: '<p>{{name}}</p>',
      values: buildTokenValues({ ...record, name: '<script>alert(1)</script>' }),
    });
    expect(html).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('escapes a quote so it cannot break out of an attribute', () => {
    const html = renderSignature({
      templateHtml: '<a title="{{name}}">x</a>',
      values: buildTokenValues({ ...record, name: '" onmouseover="alert(1)' }),
    });
    expect(html).toBe('<a title="&quot; onmouseover=&quot;alert(1)">x</a>');
  });

  it('throws on an unknown token rather than emitting an empty string', () => {
    expect(() =>
      renderSignature({ templateHtml: '<p>{{jobtitle}}</p>', values: buildTokenValues(record) }),
    ).toThrow(/Unknown signature token "\{\{jobtitle\}\}"/);
  });

  it('leaves a template with no tokens unchanged', () => {
    const html = renderSignature({
      templateHtml: '<td>Start Clean. Stay Secure.</td>',
      values: buildTokenValues(record),
    });
    expect(html).toBe('<td>Start Clean. Stay Secure.</td>');
  });
});
