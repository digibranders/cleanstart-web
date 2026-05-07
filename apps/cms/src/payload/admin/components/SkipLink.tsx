'use client';

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

/**
 * Keyboard-only "skip to main content" affordance. Renders a hidden
 * anchor that becomes visible only on `:focus` (styled in
 * `_a11y.scss`), letting Tab-key users jump past the sidebar nav and
 * app header straight to the document body.
 *
 * The target is `#cs-main-content` — added as an anchor on the first
 * `<main>` / `.template-default__main` / first `.gutter` we can find,
 * with a MutationObserver re-tagging on route changes.
 */
export const SkipLink = (): ReactElement => {
  const [target, setTarget] = useState<string>('#cs-main-content');

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const tag = (): void => {
      const candidates = [
        document.querySelector('main'),
        document.querySelector('.template-default__main'),
        document.querySelector('.gutter'),
      ];
      for (const el of candidates) {
        if (el && el.id !== 'cs-main-content') {
          el.id = 'cs-main-content';
          el.setAttribute('tabindex', '-1');
          setTarget('#cs-main-content');
          return;
        }
        if (el?.id === 'cs-main-content') {
          setTarget('#cs-main-content');
          return;
        }
      }
    };

    tag();
    const observer = new MutationObserver(tag);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <a className="cs-skip-link" href={target}>
      Skip to main content
    </a>
  );
};

export default SkipLink;
