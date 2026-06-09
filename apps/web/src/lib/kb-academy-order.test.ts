import { describe, expect, test } from 'vitest';

import { KB_ACADEMY_ORDER, academyOrderOf } from './kb-academy-order';

describe('KB_ACADEMY_ORDER', () => {
  test('covers all 245 Academy articles with a contiguous 0..244 range', () => {
    const positions = Object.values(KB_ACADEMY_ORDER).sort((a, b) => a - b);
    expect(positions.length).toBe(245);
    expect(new Set(positions).size).toBe(245); // no duplicate positions
    expect(positions[0]).toBe(0);
    expect(positions[positions.length - 1]).toBe(244);
  });

  test('opens with the exact Academy Fundamentals sequence', () => {
    const firstSix = Object.entries(KB_ACADEMY_ORDER)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 6)
      .map(([slug]) => slug);
    expect(firstSix).toEqual([
      'containers-vs-virtual-machines',
      'images-and-containers',
      'container-image-fundamentals',
      'container-image-layers-deep-dive',
      'docker-and-oci-specification',
      'container-runtimes-explained',
    ]);
  });

  test('includes the collision-renamed secure slugs', () => {
    expect(KB_ACADEMY_ORDER['secure-vendor-risk-assessment']).toBeTypeOf('number');
    expect(KB_ACADEMY_ORDER['secure-vex-documents']).toBeTypeOf('number');
  });
});

describe('academyOrderOf', () => {
  test('returns the mapped position for a known slug', () => {
    expect(academyOrderOf('containers-vs-virtual-machines')).toBe(0);
  });

  test('returns +Infinity for an unmapped (legacy / unknown) slug', () => {
    expect(academyOrderOf('keyless-container')).toBe(Number.POSITIVE_INFINITY);
    expect(academyOrderOf('not-a-real-slug')).toBe(Number.POSITIVE_INFINITY);
  });

  test('orders Academy articles before unmapped ones', () => {
    expect(academyOrderOf('container-image-layers-deep-dive')).toBeLessThan(
      academyOrderOf('keyless-container'),
    );
  });
});
