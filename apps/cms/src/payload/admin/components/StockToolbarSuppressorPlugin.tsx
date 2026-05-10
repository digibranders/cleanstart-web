'use client';

import { useEffect } from 'react';

const STOCK_KEYS = ['link', 'table'] as const;

const hideStockButtons = (root: ParentNode): void => {
  for (const key of STOCK_KEYS) {
    const matches = root.querySelectorAll<HTMLElement>(
      `[data-button-key="${key}"]`,
    );
    for (const node of matches) {
      if (!node.hasAttribute('data-cs-hidden')) {
        node.setAttribute('data-cs-hidden', 'true');
        node.style.display = 'none';
      }
    }
  }
};

/**
 * Stock Payload feature buttons (`Link`, `Table`) are hardcoded into
 * the LinkFeature / EXPERIMENTAL_TableFeature client features and have
 * no config-level disable switch. Side-effect SCSS imports proved
 * unreliable for hiding them across hot-reload, fixed/inline toolbar
 * remounts, and dropdown re-opens — so we run a MutationObserver on
 * the document body, marking and `display: none`-ing any element
 * whose `data-button-key` matches a stock key. Our replacement buttons
 * use distinct keys (`cs-link`, `cs-table`) and survive the suppress.
 */
export function StockToolbarSuppressorPlugin(): null {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    hideStockButtons(document);
    const observer = new MutationObserver(() => {
      hideStockButtons(document);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
    };
  }, []);
  return null;
}
