import Image from "next/image";

export function RadarScanner(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative w-full h-full pointer-events-none select-none"
      data-component="RadarScanner"
    >
      <Image
        src="/images/cleansight/scanner-bg.png"
        alt=""
        fill
        priority={false}
        sizes="(max-width: 768px) 280px, 580px"
        className="object-contain"
      />

      <div className="radar-sweep absolute inset-0 rounded-full" />

      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: "12px",
          height: "12px",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(220,235,255,1) 0%, rgba(96,165,250,0.9) 35%, rgba(59,130,246,0) 75%)",
          boxShadow: "0 0 22px 6px rgba(59,130,246,0.8)",
        }}
      />

      <style>{`
        .radar-sweep {
          background: conic-gradient(
            from 0deg,
            rgba(59, 130, 246, 0) 0deg,
            rgba(59, 130, 246, 0) 268deg,
            rgba(59, 130, 246, 0.20) 300deg,
            rgba(96, 165, 250, 0.55) 335deg,
            rgba(147, 197, 253, 0.95) 357deg,
            rgba(219, 234, 254, 1) 360deg
          );
          mix-blend-mode: screen;
          filter: blur(0.5px);
          will-change: transform;
          transform-origin: 50% 50%;
          animation: radar-sweep-rotate 4s linear infinite;
          -webkit-mask-image: radial-gradient(circle closest-side at center, #000 0%, #000 86%, transparent 89%);
                  mask-image: radial-gradient(circle closest-side at center, #000 0%, #000 86%, transparent 89%);
        }
        @keyframes radar-sweep-rotate {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .radar-sweep { animation: none; }
        }
      `}</style>
    </div>
  );
}
