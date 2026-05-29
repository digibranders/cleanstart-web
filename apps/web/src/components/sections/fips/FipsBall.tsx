interface FipsBallProps {
  size?: number;
  iconSrc?: string;
}

export function FipsBall({ size = 155, iconSrc }: FipsBallProps): React.ReactElement {
  return (
    <div
      className="relative shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Drop shadow scaled by ball size so smaller mobile balls don't read overweighted. */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(28, 60, 142, 0.33) 0%, rgba(28, 60, 142, 0) 72%)",
          filter: `blur(${Math.max(8, size * 0.12)}px)`,
          transform: `translateY(${size * 0.08}px) scale(1.08)`,
        }}
      />
      {/* Cyan halo keeps the ball lit on darker card backgrounds. */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(35, 156, 255, 0.28) 0%, rgba(35, 156, 255, 0) 75%)",
          filter: `blur(${Math.max(6, size * 0.08)}px)`,
          transform: "scale(1.18)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #5DB6FF 0%, #239CFF 38%, #005BE3 78%, #003F9F 100%)",
          boxShadow:
            "inset 0 -10px 22px rgba(0, 41, 162, 0.55), inset 0 6px 14px rgba(255, 255, 255, 0.4)",
        }}
      >
        <div
          aria-hidden
          className="absolute"
          style={{
            top: "8%",
            left: "14%",
            width: "55%",
            height: "30%",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 100%)",
            filter: "blur(2px)",
          }}
        />
        <div
          aria-hidden
          className="absolute"
          style={{
            bottom: "-2%",
            left: "12%",
            width: "76%",
            height: "30%",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(0, 30, 90, 0.55) 0%, rgba(0, 30, 90, 0) 100%)",
            filter: "blur(2px)",
          }}
        />
      </div>

      {iconSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute"
          style={{
            width: "56%",
            height: "56%",
            left: "22%",
            top: "22%",
            objectFit: "contain",
            filter: "drop-shadow(0 3px 4px rgba(0, 30, 90, 0.45))",
          }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          className="absolute"
          style={{
            width: "56%",
            height: "56%",
            left: "22%",
            top: "22%",
            filter: "drop-shadow(0 3px 4px rgba(0, 30, 90, 0.45))",
          }}
          aria-hidden
        >
          <defs>
            <linearGradient id="cubeTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#D6E7FF" />
            </linearGradient>
            <linearGradient id="cubeLeft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#A8C8F2" />
              <stop offset="100%" stopColor="#7BA9E3" />
            </linearGradient>
            <linearGradient id="cubeRight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C8D9F0" />
              <stop offset="100%" stopColor="#92B5E5" />
            </linearGradient>
          </defs>
          <g transform="translate(50 18)">
            <polygon points="0,0 14,8 0,16 -14,8" fill="url(#cubeTop)" />
            <polygon points="-14,8 0,16 0,30 -14,22" fill="url(#cubeLeft)" />
            <polygon points="14,8 0,16 0,30 14,22" fill="url(#cubeRight)" />
          </g>
          <g transform="translate(32 42)">
            <polygon points="0,0 14,8 0,16 -14,8" fill="url(#cubeTop)" />
            <polygon points="-14,8 0,16 0,30 -14,22" fill="url(#cubeLeft)" />
            <polygon points="14,8 0,16 0,30 14,22" fill="url(#cubeRight)" />
          </g>
          <g transform="translate(68 42)">
            <polygon points="0,0 14,8 0,16 -14,8" fill="url(#cubeTop)" />
            <polygon points="-14,8 0,16 0,30 -14,22" fill="url(#cubeLeft)" />
            <polygon points="14,8 0,16 0,30 14,22" fill="url(#cubeRight)" />
          </g>
        </svg>
      )}
    </div>
  );
}
