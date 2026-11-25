import sharp from 'sharp';

/**
 * The co-branding strip for an event's emails, as one image: CleanStart then
 * each partner on the page's dark gradient, joined by thin lines. Email clients
 * do not show SVG and handle layered markup unevenly, so one opaque PNG is the
 * only version that looks the same in Gmail, Outlook and Apple Mail, light or
 * dark. It is drawn at twice its display size (520 by 100) so it stays sharp on
 * retina screens.
 */

const WIDTH = 1040;
const HEIGHT = 200;
const SIDE_PADDING = 60;
const LOGO_HEIGHT = 56;
const GAP = 130;
const LINE_LENGTH = 70;

const BACKGROUND = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
<defs>
<radialGradient id="a" cx="85%" cy="0%" r="70%"><stop offset="0" stop-color="#471ec0" stop-opacity="0.6"/><stop offset="1" stop-color="#471ec0" stop-opacity="0"/></radialGradient>
<radialGradient id="b" cx="5%" cy="100%" r="60%"><stop offset="0" stop-color="#2cc1eb" stop-opacity="0.22"/><stop offset="1" stop-color="#2cc1eb" stop-opacity="0"/></radialGradient>
</defs>
<rect width="100%" height="100%" fill="#151021"/><rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/>
</svg>`;

const connector = (length: number): Buffer =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${length}" height="2">
<defs><linearGradient id="l"><stop offset="0" stop-color="#2cc1eb" stop-opacity="0"/><stop offset="0.5" stop-color="#2cc1eb"/><stop offset="1" stop-color="#ab8cff" stop-opacity="0"/></linearGradient></defs>
<rect width="100%" height="2" fill="url(#l)"/></svg>`);

type Rendered = { data: Buffer; width: number; height: number };

const renderAt = (logos: readonly Buffer[], height: number): Promise<Rendered[]> =>
  Promise.all(
    logos.map(async (logo) => {
      const { data, info } = await sharp(logo, { density: 300 })
        .resize({ height, fit: 'inside' })
        .png()
        .toBuffer({ resolveWithObject: true });
      return { data, width: info.width, height: info.height };
    }),
  );

/** `logos` are image bytes (SVG or raster), in the order they should appear. */
export const composeEventBanner = async (logos: readonly Buffer[]): Promise<Buffer> => {
  if (logos.length === 0) throw new Error('composeEventBanner needs at least one logo');

  const usable = WIDTH - 2 * SIDE_PADDING;
  let items = await renderAt(logos, LOGO_HEIGHT);
  let gap = GAP;
  const natural = items.reduce((sum, item) => sum + item.width, 0) + GAP * (items.length - 1);
  // Many or wide logos: shrink the logos and the gaps between them together so the strip fits.
  if (natural > usable) {
    const factor = usable / natural;
    items = await renderAt(logos, Math.max(12, Math.floor(LOGO_HEIGHT * factor)));
    gap = Math.floor(GAP * factor);
  }

  const lineLength = Math.min(LINE_LENGTH, gap - 24);
  const total = items.reduce((sum, item) => sum + item.width, 0) + gap * (items.length - 1);
  let x = Math.round((WIDTH - total) / 2);
  const layers: sharp.OverlayOptions[] = [];
  items.forEach((item, index) => {
    layers.push({ input: item.data, left: x, top: Math.round((HEIGHT - item.height) / 2) });
    x += item.width;
    if (index < items.length - 1) {
      if (lineLength >= 16) {
        layers.push({ input: connector(lineLength), left: x + Math.round((gap - lineLength) / 2), top: HEIGHT / 2 - 1 });
      }
      x += gap;
    }
  });

  return sharp(Buffer.from(BACKGROUND)).composite(layers).png().toBuffer();
};
