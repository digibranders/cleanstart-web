'use client';

import { useEffect } from 'react';

const STOCK_BUTTON_KEYS = ['link', 'table'] as const;
// The `add` dropdown group (key="add") is contributed to by EXPERIMENTAL_TableFeature,
// RelationshipFeature, HorizontalRuleFeature, and UploadFeature. Each item opens a stock
// Payload drawer. We suppress the entire group and replace it with our custom AddMenu.
const STOCK_GROUP_KEYS = ['add'] as const;

const hideStockToolbarItems = (root: ParentNode): void => {
  for (const key of STOCK_BUTTON_KEYS) {
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
  for (const key of STOCK_GROUP_KEYS) {
    const matches = root.querySelectorAll<HTMLElement>(
      `[data-toolbar-group-key="${key}"]`,
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
    hideStockToolbarItems(document);
    const observer = new MutationObserver(() => {
      hideStockToolbarItems(document);
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
