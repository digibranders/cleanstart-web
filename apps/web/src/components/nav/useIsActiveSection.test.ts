// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useIsActiveSection } from './useIsActiveSection';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('useIsActiveSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when pathname exactly matches one of the section hrefs', () => {
    vi.mocked(usePathname).mockReturnValue('/cleansight');
    const { result } = renderHook(() =>
      useIsActiveSection(['/cleanstart-images', '/software-bill-materials', '/cleansight']),
    );
    expect(result.current).toBe(true);
  });

  it('returns true when pathname is a sub-route of a section href', () => {
    vi.mocked(usePathname).mockReturnValue('/cleanstart-images/python');
    const { result } = renderHook(() => useIsActiveSection(['/cleanstart-images']));
    expect(result.current).toBe(true);
  });

  it('returns false when pathname is /cleanstart-imagesomething (false-prefix guard)', () => {
    vi.mocked(usePathname).mockReturnValue('/cleanstart-imagesomething');
    const { result } = renderHook(() => useIsActiveSection(['/cleanstart-images']));
    expect(result.current).toBe(false);
  });

  it('returns false when no href matches', () => {
    vi.mocked(usePathname).mockReturnValue('/about-us');
    const { result } = renderHook(() => useIsActiveSection(['/cleanstart-images', '/cleansight']));
    expect(result.current).toBe(false);
  });

  it('ignores the root href "/" to avoid matching everything', () => {
    vi.mocked(usePathname).mockReturnValue('/blogs');
    const { result } = renderHook(() => useIsActiveSection(['/']));
    expect(result.current).toBe(false);
  });
});
