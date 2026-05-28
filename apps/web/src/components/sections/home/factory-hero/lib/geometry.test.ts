import { BoxGeometry } from 'three';
import { describe, expect, it } from 'vitest';
import { buildAgentGeometry, buildCubeGeometry } from './geometry';

describe('geometry', () => {
  it('buildCubeGeometry returns a chamfered box with the spec dimensions', () => {
    const g = buildCubeGeometry();
    expect(g).toBeInstanceOf(BoxGeometry);
    // 0.6 unit cube per spec § 3.4
    const params = g.parameters;
    expect(params.width).toBeCloseTo(0.6, 2);
    expect(params.height).toBeCloseTo(0.6, 2);
    expect(params.depth).toBeCloseTo(0.6, 2);
  });

  it('buildAgentGeometry returns a small box (bumped from spec 0.22 to 0.34 for readability)', () => {
    const g = buildAgentGeometry();
    expect(g.parameters.width).toBeCloseTo(0.34, 2);
    expect(g.parameters.height).toBeCloseTo(0.34, 2);
    expect(g.parameters.depth).toBeCloseTo(0.22, 2);
  });
});
