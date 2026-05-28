import { glyphs, type GlyphId } from './glyphs';

type Props = {
  id: GlyphId | string;
  size?: number;
  className?: string;
};

/**
 * Single SVG icon rendering one glyph from the map.
 * stroke-width and viewBox are normalized — only the path content varies.
 * If the id is unknown, returns a low-opacity placeholder rect so layout
 * doesn't collapse (defensive; the glyphs.test.ts unit test asserts no
 * unknown ids ship from nav-config).
 */
export function NavIcon({ id, size = 20, className }: Props) {
  const node = glyphs[id as GlyphId];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {node ?? <rect x="2" y="2" width="20" height="20" rx="3" opacity="0.2" />}
    </svg>
  );
}
