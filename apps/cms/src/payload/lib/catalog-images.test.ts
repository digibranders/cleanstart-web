import { describe, expect, it } from 'vitest';

import { filterCatalogNames, parseCatalogNames } from './catalog-images';

const sitemap = `<urlset>
<url><loc>https://images.cleanstart.com/images/redis/details</loc></url>
<url><loc>https://images.cleanstart.com/images/redis-fips/details</loc></url>
<url><loc>https://images.cleanstart.com/images/node/details</loc></url>
<url><loc>https://images.cleanstart.com/images/cert-manager-controller/details</loc></url>
<url><loc>https://images.cleanstart.com/about</loc></url>
</urlset>`;

describe('parseCatalogNames', () => {
  it('reads the image names, folds fips variants into their base and sorts', () => {
    expect(parseCatalogNames(sitemap)).toEqual(['cert-manager-controller', 'node', 'redis']);
  });

  it('returns nothing for a page that is not the sitemap', () => {
    expect(parseCatalogNames('<html>nope</html>')).toEqual([]);
  });
});

describe('filterCatalogNames', () => {
  const names = ['node', 'node-exporter', 'python', 'nginx'];

  it('returns everything for an empty query', () => {
    expect(filterCatalogNames(names, '  ')).toEqual(names);
  });

  it('puts names that start with the query first, then the rest that contain it', () => {
    expect(filterCatalogNames(['prometheus-node-exporter', 'node', 'node-exporter'], 'node')).toEqual([
      'node',
      'node-exporter',
      'prometheus-node-exporter',
    ]);
  });

  it('ignores case', () => {
    expect(filterCatalogNames(names, 'PYTH')).toEqual(['python']);
  });
});
