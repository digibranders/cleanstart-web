import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// The note is hook-free; the package is mocked because loading it pulls in
// stylesheets the node test runner cannot import.
vi.mock('@payloadcms/ui', () => ({ useDocumentInfo: vi.fn(), useField: vi.fn() }));

import { AutoPickNote, type Suggestion, hasValue } from './BlogCtaAutoPick';

const ready = (over: Partial<Suggestion> = {}) => ({
  phase: 'ready' as const,
  suggestion: { available: true, resource: null, image: null, ...over },
});
const html = (el: ReturnType<typeof AutoPickNote>) => renderToStaticMarkup(el);

describe('AutoPickNote', () => {
  it('asks to save a new post first', () => {
    expect(html(<AutoPickNote kind="resource" state={{ phase: 'unsaved' }} overridden={false} />)).toContain(
      'Save the post to see which one the page picks automatically.',
    );
  });

  it('shows a loading line, and a soft message when the pick cannot be loaded', () => {
    expect(html(<AutoPickNote kind="image" state={{ phase: 'loading' }} overridden={false} />)).toContain('Checking');
    expect(
      html(
        <AutoPickNote
          kind="image"
          state={{ phase: 'ready', suggestion: { available: false, resource: null, image: null } }}
          overridden={false}
        />,
      ),
    ).toContain('could not be loaded');
  });

  it('names the automatic resource and how to override it', () => {
    const out = html(
      <AutoPickNote
        kind="resource"
        state={ready({ resource: { title: 'Securing the Software Supply Chain in 2026', typeLabel: 'Report', slug: 's' } })}
        overridden={false}
      />,
    );
    expect(out).toContain('<strong>Securing the Software Supply Chain in 2026</strong> (Report)');
    expect(out).toContain('Choose one above to override it.');
  });

  it('says what the automatic pick would be when an editor pick overrides it', () => {
    const out = html(
      <AutoPickNote kind="image" state={ready({ image: { name: 'ollama' } })} overridden />,
    );
    expect(out).toContain('Your pick overrides the automatic one, which would be <code>ollama</code>.');
  });

  it('explains an empty automatic pick for each kind', () => {
    expect(html(<AutoPickNote kind="resource" state={ready()} overridden={false} />)).toContain(
      'none, because no published resource matches',
    );
    expect(html(<AutoPickNote kind="image" state={ready()} overridden={false} />)).toContain(
      'none, so the page shows the whole catalog',
    );
  });

  it('escapes a title instead of rendering it as markup', () => {
    const out = html(
      <AutoPickNote
        kind="resource"
        state={ready({ resource: { title: '<img src=x onerror=alert(1)>', typeLabel: 'Report', slug: 's' } })}
        overridden={false}
      />,
    );
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });
});

describe('hasValue', () => {
  it('treats null, undefined and blank text as no override, and anything else as an override', () => {
    expect(hasValue(null)).toBe(false);
    expect(hasValue(undefined)).toBe(false);
    expect(hasValue('  ')).toBe(false);
    expect(hasValue('redis')).toBe(true);
    expect(hasValue(7)).toBe(true);
    expect(hasValue({ id: 7 })).toBe(true);
  });
});
