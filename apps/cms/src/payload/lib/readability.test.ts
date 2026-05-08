import { describe, expect, it } from 'vitest';

import { scoreReadability } from './readability';

describe('scoreReadability', () => {
  it('returns zeros for empty input', () => {
    const result = scoreReadability('');
    expect(result.score).toBe(0);
    expect(result.words).toBe(0);
    expect(result.sentences).toBe(0);
  });

  it('counts simple sentences and words', () => {
    const result = scoreReadability('The cat sat. The dog ran.');
    expect(result.words).toBe(6);
    expect(result.sentences).toBe(2);
    expect(result.score).toBeGreaterThan(0);
  });

  it('places very short, simple prose in the easy or very-easy band', () => {
    const result = scoreReadability(
      'The cat sat on the mat. The dog ran in the park. They had fun together.',
    );
    expect(['easy', 'very-easy']).toContain(result.band);
  });

  it('places dense academic prose in the standard or difficult band', () => {
    const result = scoreReadability(
      'The phenomenological underpinnings of computational epistemology necessitate a reconfiguration of foundational metaphysical assumptions concerning consciousness, intentionality, and representational opacity within distributed cognitive architectures.',
    );
    expect(['standard', 'difficult']).toContain(result.band);
  });

  it('treats text with no terminal punctuation as a single sentence rather than zero', () => {
    const result = scoreReadability('A single fragment of writing without a period');
    expect(result.sentences).toBe(1);
    expect(result.words).toBe(8);
  });

  it('clamps the score to 0..100', () => {
    const result = scoreReadability('Hi.');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
