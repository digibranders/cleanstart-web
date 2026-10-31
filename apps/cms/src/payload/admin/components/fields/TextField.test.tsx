import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

let mockValue: unknown = ['CVE-2026-111497', 'CVE-2026-222222'];

vi.mock('@payloadcms/ui', () => ({
  useField: () => ({
    value: mockValue,
    setValue: vi.fn(),
    disabled: false,
    showError: false,
    errorMessage: undefined,
  }),
}));

const { TextField } = await import('./TextField');

const render = (hasMany: boolean): string =>
  renderToStaticMarkup(
    <TextField
      {...({
        path: 'cves',
        field: { type: 'text', name: 'cves', label: 'CVE IDs', hasMany, required: true },
      } as unknown as Parameters<typeof TextField>[0])}
    />,
  );

describe('TextField hasMany', () => {
  it('renders one removable chip per value plus an add input', () => {
    mockValue = ['CVE-2026-111497', 'CVE-2026-222222'];
    const html = render(true);
    expect(html).toContain('CVE-2026-111497');
    expect(html).toContain('CVE-2026-222222');
    expect(html).toContain('aria-label="Remove CVE-2026-222222"');
    expect(html).toContain('Type a value and press Enter to add it');
  });

  it('renders no chip list for an empty list', () => {
    mockValue = [];
    expect(render(true)).not.toContain('cs-text-field__chips');
  });

  it('keeps the single input for a plain text field', () => {
    mockValue = 'hello';
    const html = render(false);
    expect(html).toContain('value="hello"');
    expect(html).not.toContain('cs-text-field__chips');
  });
});
