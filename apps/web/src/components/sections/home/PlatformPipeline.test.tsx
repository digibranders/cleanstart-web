// @vitest-environment happy-dom

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PlatformPipeline } from './PlatformPipeline';

function renderSection(): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(<PlatformPipeline />);
  return root;
}

describe('homepage platform architecture', () => {
  it('exposes three named products with distinct, descriptive navigation', () => {
    const root = renderSection();
    const products = root.querySelectorAll('article');
    expect(products).toHaveLength(3);
    expect(Array.from(products, (p) => p.getAttribute('data-product'))).toEqual([
      'images',
      'libs',
      'sight',
    ]);

    const destinations = [
      ['Clean Images', '/cleanstart-images'],
      ['Clean Libraries', '/clean-libraries'],
      ['CleanSight', '/cleansight'],
    ];
    destinations.forEach(([name, href], index) => {
      expect(products[index]?.querySelector('h3')?.textContent).toBe(name);
      const link = products[index]?.querySelector('a');
      expect(link?.getAttribute('href')).toBe(href);
      expect(link?.getAttribute('aria-label')).toBe(`Explore ${name}`);
      expect(link?.querySelector('h3')?.textContent).toBe(name);
      const descriptionId = link?.getAttribute('aria-describedby');
      expect(descriptionId).toBeTruthy();
      const description = root.querySelector(`[id="${descriptionId}"]`);
      expect(description?.textContent?.trim().length).toBeGreaterThan(20);
      expect(link?.contains(description)).toBe(true);
    });
  });

  it('explains the common intelligence foundation without a canvas or client effects', () => {
    const root = renderSection();
    const foundation = root.querySelector('aside');
    expect(foundation?.textContent).toContain('CleanStart Intelligence Center');
    expect(foundation?.textContent).toContain('Tricorder');
    expect(foundation?.querySelector('a')?.getAttribute('href')).toBe('/tricorder');
    expect(foundation?.querySelector('a h3')?.textContent).toBe('CleanStart Intelligence Center');
    expect(foundation?.querySelector('a')?.textContent).toContain('Explore Tricorder');
    expect(root.querySelector('section')?.getAttribute('aria-labelledby')).toBe(
      root.querySelector('h2')?.id,
    );
    expect(root.querySelector('canvas')).toBeNull();
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelectorAll('a')).toHaveLength(4);
  });
});
