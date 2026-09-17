import type { LucideIcon } from 'lucide-react';

/**
 * The site's blue gradient sphere (the SaasDemands / CisoEnterprise icon
 * treatment) carrying a white line glyph. `dim` renders it desaturated for a
 * stage the Tricorder scan has not reached yet.
 */
export function IconSphere({
  icon: Icon,
  size,
  dim = false,
}: {
  icon: LucideIcon;
  size: number;
  dim?: boolean;
}): React.ReactElement {
  return (
    <span
      aria-hidden
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-[filter,opacity,box-shadow] duration-500"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
        boxShadow: dim
          ? '0 4px 10px rgba(28,60,142,0.18), inset 0 -0.25px 0.3px rgba(0,44,179,0.5), inset 0 0.5px 1px rgba(255,255,255,0.81)'
          : '0 8px 18px rgba(28,60,142,0.35), inset 0 -0.25px 0.3px rgba(0,44,179,0.5), inset 0 0.5px 1px rgba(255,255,255,0.81)',
        filter: dim ? 'saturate(0.25) brightness(1.15)' : 'none',
        opacity: dim ? 0.6 : 1,
      }}
    >
      <span
        className="pointer-events-none absolute rounded-full"
        style={{
          top: '-38%',
          left: '-10%',
          width: '120%',
          height: '80%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 75%)',
        }}
      />
      <Icon
        size={Math.round(size * 0.46)}
        strokeWidth={1.8}
        color="#FFFFFF"
        className="relative"
        style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,30,90,0.35))' }}
      />
    </span>
  );
}
