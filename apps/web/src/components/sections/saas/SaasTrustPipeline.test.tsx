// @vitest-environment happy-dom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('motion/react', () => ({
  useInView: () => true,
  useReducedMotion: () => false,
}));

import { SaasTrustPipeline } from './SaasTrustPipeline';

/*
 * The scene is a phase machine on a frame clock. These tests pin the order of
 * beats and the invariant the choreography depends on: the chips are absorbed
 * before the descent begins, so nothing is still folding in at touchdown.
 */

const FRAME = 16;

function scene(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-scene="horizontal"]');
  if (!el) throw new Error('horizontal scene not rendered');
  return el;
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms + FRAME);
  });
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SaasTrustPipeline clock', () => {
  it('rewinds from the server-rendered settled frame to idle on mount', () => {
    const { container } = render(<SaasTrustPipeline />);
    expect(scene(container).dataset.phase).toBe('idle');
    expect(scene(container).dataset.fill).toBeUndefined();
  });

  it('walks the beats in order and loops', () => {
    const { container } = render(<SaasTrustPipeline />);
    const svg = scene(container);

    advance(400);
    expect(svg.dataset.phase).toBe('flight');
    advance(1800);
    expect(svg.dataset.phase).toBe('hover');
    advance(1500);
    expect(svg.dataset.phase).toBe('absorb');
    advance(700);
    expect(svg.dataset.phase).toBe('descend');
    advance(750);
    expect(svg.dataset.phase).toBe('docked');
    advance(400);
    expect(svg.dataset.phase).toBe('fill');
    advance(4200);
    expect(svg.dataset.phase).toBe('settled');
    advance(1400);
    expect(svg.dataset.phase).toBe('exit');
    advance(400);
    expect(svg.dataset.phase).toBe('idle');
  });

  it('absorbs the chips before the descent, and lands with them gone', () => {
    const { container } = render(<SaasTrustPipeline />);
    const svg = scene(container);

    advance(400 + 1800);
    expect(svg.dataset.phase).toBe('hover');
    expect(svg.dataset.absorb).toBeUndefined();
    expect(svg.dataset.descend).toBeUndefined();

    advance(1500);
    expect(svg.dataset.phase).toBe('absorb');
    expect(svg.dataset.absorb).toBe('true');
    expect(svg.dataset.descend).toBeUndefined();

    advance(700);
    expect(svg.dataset.phase).toBe('descend');
    expect(svg.dataset.absorb).toBe('true');
    expect(svg.dataset.docked).toBeUndefined();
  });

  it('holds the hover for at least two seconds of chip-reading time', () => {
    const { container } = render(<SaasTrustPipeline />);
    const svg = scene(container);

    advance(400 + 1800);
    const hoverStart = performance.now();
    while (svg.dataset.phase !== 'descend') advance(50);
    /* Chips are legible from the start of the hover until the descent. */
    expect(performance.now() - hoverStart).toBeGreaterThanOrEqual(2000);
  });
});
