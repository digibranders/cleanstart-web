/**
 * The product emblems (public/images/cleanstart-factory/emblem-*.webp, transparent
 * cut-outs) and the CleanStart logomark. The cards show these files as they are, and the particle field is
 * sampled from the same pixels, so the dust always forms the logo the visitor
 * can see on the card.
 *
 * `trim` is the visible emblem inside each file, as fractions of the file's
 * width and height (offset x, offset y, width, height), measured from pixels
 * with alpha above 45%.
 */

export type ProductKey = "images" | "libs" | "sight";

export const PRODUCT_KEYS: readonly ProductKey[] = ["images", "libs", "sight"];

export interface ProductArt {
  readonly src: string;
  /** Intrinsic width and height of the file. */
  readonly size: number;
  readonly trim: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
}

export const PRODUCT_ART: Readonly<Record<ProductKey, ProductArt>> = {
  images: {
    src: "/images/cleanstart-factory/emblem-images.webp",
    size: 768,
    trim: { x: 76 / 768, y: 27 / 768, w: 616 / 768, h: 714 / 768 },
  },
  libs: {
    src: "/images/cleanstart-factory/emblem-libraries.webp",
    size: 768,
    trim: { x: 76 / 768, y: 28 / 768, w: 615 / 768, h: 712 / 768 },
  },
  sight: {
    src: "/images/cleanstart-factory/emblem-cleansight.webp",
    size: 768,
    trim: { x: 77 / 768, y: 28 / 768, w: 614 / 768, h: 713 / 768 },
  },
};

/** Next's optimiser URL for a public image, at a width the config allows. */
export function optimisedImageUrl(src: string, width = 384): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

/** Display width at which a file's visible badge is `badgePx` tall. */
export function renderWidthFor(key: ProductKey, badgePx: number): number {
  return Math.round(badgePx / PRODUCT_ART[key].trim.h);
}

/** CleanStart logomark paths (54 x 62), from public/images/security/cs-logomark.svg. */
export const LOGOMARK = {
  w: 54,
  h: 62,
  cyan: "M46.9625 20.003V42.736L30.44 52.7013V29.5923L24.0176 33.3225L24.1982 33.4256V60.3558L26.9308 61.9995L53.8605 46.1386V16.1273L53.7461 16.0605L46.9625 20.003Z",
  white:
    "M30.4388 29.4897L9.88342 17.2984L27.1824 7.73332L46.9553 19.1362V19.9975L53.7388 16.055L26.7972 0L0 16.1217V45.7449L6.24786 49.5114V22.8057L24.0164 33.317L30.4388 29.5868V29.4897Z",
} as const;
