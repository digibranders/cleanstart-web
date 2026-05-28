// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewportMode } from './useViewportMode';

function setViewport(w: number): void {
  Object.defineProperty(window, 'innerWidth', { writable: true, value: w });
  window.dispatchEvent(new Event('resize'));
}

describe('useViewportMode', () => {
  it('returns "desktop" at 1440px', () => {
    setViewport(1440);
    const { result } = renderHook(() => useViewportMode());
    expect(result.current).toBe('desktop');
  });

  it('returns "mid" at 1024px', () => {
    setViewport(1024);
    const { result } = renderHook(() => useViewportMode());
    expect(result.current).toBe('mid');
  });

  it('returns "mobile" at 375px', () => {
    setViewport(375);
    const { result } = renderHook(() => useViewportMode());
    expect(result.current).toBe('mobile');
  });

  it('updates when the viewport resizes', () => {
    setViewport(1440);
    const { result } = renderHook(() => useViewportMode());
    expect(result.current).toBe('desktop');
    act(() => setViewport(375));
    expect(result.current).toBe('mobile');
  });
});
