import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { composeEventBanner } from './banner';

const logo = (width: number, height: number): Buffer =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/></svg>`,
  );

describe('composeEventBanner', () => {
  it('draws one PNG at the fixed email size', async () => {
    const png = await composeEventBanner([logo(160, 40), logo(80, 24), logo(120, 30)]);
    const meta = await sharp(png).metadata();
    expect(meta.format).toBe('png');
    expect([meta.width, meta.height]).toEqual([1040, 200]);
  });

  it('keeps the strip inside the image when there are many wide logos', async () => {
    const png = await composeEventBanner(Array.from({ length: 5 }, () => logo(400, 40)));
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    // The outermost columns stay background (the gradient is purple, a logo is pure white):
    // no logo reaches the edge.
    const px = (x: number, y: number): number[] =>
      Array.from(data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3));
    expect(px(2, 100).every((v) => v < 200)).toBe(true);
    expect(px(info.width - 3, 100).every((v) => v < 200)).toBe(true);
  });

  it('refuses an empty list', async () => {
    await expect(composeEventBanner([])).rejects.toThrow();
  });
});
