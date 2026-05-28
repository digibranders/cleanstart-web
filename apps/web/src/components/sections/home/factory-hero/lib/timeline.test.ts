import { describe, expect, it } from 'vitest';
import { type CubePhase, getCubePhase } from './timeline';

describe('getCubePhase', () => {
  it('returns "spawning" before chamber 01 entry', () => {
    expect(getCubePhase(0.4, 0).stage).toBe('spawning');
  });

  it('returns "ch1" while inside chamber 01', () => {
    const p: CubePhase = getCubePhase(1.5, 0);
    expect(p.stage).toBe('ch1');
    expect(p.dwell).toBeGreaterThan(0);
    expect(p.dwell).toBeLessThanOrEqual(1);
  });

  it('returns "ch3-cleancompile" during the transformation window', () => {
    expect(getCubePhase(5.0, 0).stage).toBe('ch3-cleancompile');
  });

  it('returns "clean" material once past CleanCompile', () => {
    expect(getCubePhase(6.0, 0).material).toBe('clean');
    expect(getCubePhase(2.0, 0).material).toBe('dirty');
  });

  it('wraps the loop at exactly 10s', () => {
    expect(getCubePhase(10.0, 0)).toEqual(getCubePhase(0.0, 0));
    expect(getCubePhase(15.0, 0)).toEqual(getCubePhase(5.0, 0));
  });

  it('respects the 5s offset for the second cube', () => {
    // cube B at t=0 should be at the same phase as cube A at t=5
    expect(getCubePhase(0.0, 5.0).stage).toBe(getCubePhase(5.0, 0).stage);
  });

  it('x position is monotonically increasing across the loop', () => {
    const x0 = getCubePhase(0.5, 0).x;
    const x5 = getCubePhase(5.0, 0).x;
    const x9 = getCubePhase(9.5, 0).x;
    expect(x0).toBeLessThan(x5);
    expect(x5).toBeLessThan(x9);
  });
});
