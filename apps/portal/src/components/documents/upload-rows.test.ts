import { describe, expect, it } from 'vitest';
import { defaultTypeFor, fileProblem, sortBatch, titleFromFileName } from './upload-rows';

describe('titleFromFileName', () => {
  it('drops the extension and turns separators into spaces', () => {
    expect(titleFromFileName('Q4_pricing-guide.v2.pdf')).toBe('Q4 pricing guide v2');
    expect(titleFromFileName('  Battlecard  final .PPTX')).toBe('Battlecard final');
    expect(titleFromFileName('.hidden')).toBe('hidden');
  });
});

describe('defaultTypeFor', () => {
  it('guesses video for mp4 and datasheet otherwise', () => {
    expect(defaultTypeFor('demo.MP4')).toBe('video');
    expect(defaultTypeFor('sheet.pdf')).toBe('datasheet');
  });
});

describe('fileProblem and sortBatch', () => {
  it('refuses other types, empty files and files over 100 MB', () => {
    expect(fileProblem({ name: 'a.pdf', size: 10 })).toBeNull();
    expect(fileProblem({ name: 'a.exe', size: 10 })).toMatch(/not a PDF/);
    expect(fileProblem({ name: 'a.pdf', size: 0 })).toMatch(/empty/);
    expect(fileProblem({ name: 'a.pdf', size: 101 * 1024 * 1024 })).toMatch(/over 100 MB/);
  });

  it('keeps the good files in order and says why the others were left out', () => {
    const files = [
      { name: 'a.pdf', size: 1 },
      { name: 'b.exe', size: 1 },
      { name: 'c.pdf', size: 1 },
      { name: 'd.pdf', size: 1 },
    ];
    const out = sortBatch(files, 2);
    expect(out.accepted.map((f) => f.name)).toEqual(['a.pdf', 'c.pdf']);
    expect(out.problems).toHaveLength(2);
    expect(out.problems[1]).toMatch(/d\.pdf was left out/);
  });
});
