import { describe, expect, it } from 'vitest';
import { hasMoreToTheRight } from './scroll-region';

describe('hasMoreToTheRight', () => {
  it('is true at the start of a wide table', () => {
    expect(hasMoreToTheRight({ scrollLeft: 0, clientWidth: 364, scrollWidth: 540 })).toBe(true);
  });

  it('is true part way along', () => {
    expect(hasMoreToTheRight({ scrollLeft: 100, clientWidth: 364, scrollWidth: 540 })).toBe(true);
  });

  it('is false at the end, including a fractional last position', () => {
    expect(hasMoreToTheRight({ scrollLeft: 176, clientWidth: 364, scrollWidth: 540 })).toBe(false);
    expect(hasMoreToTheRight({ scrollLeft: 175.4, clientWidth: 364, scrollWidth: 540 })).toBe(false);
  });

  it('is false when the table fits', () => {
    expect(hasMoreToTheRight({ scrollLeft: 0, clientWidth: 600, scrollWidth: 600 })).toBe(false);
  });
});
