interface RocketFlameProps {
  left: string;
  top?: string;
  height?: number;
  delay?: number;
}

export function RocketFlame({ left, top = "0", height = 220, delay = 0 }: RocketFlameProps) {
  return (
    <span
      className="cs-rocket-flame"
      style={{
        left,
        top,
        height: `${height}px`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}
