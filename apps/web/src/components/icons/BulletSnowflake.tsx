export function BulletSnowflake({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {[0, 45, 90, 135].map((deg) => (
        <line
          key={deg}
          x1="9"
          y1="2"
          x2="9"
          y2="16"
          stroke="#9AA0A6"
          strokeWidth="1.2"
          strokeLinecap="round"
          transform={`rotate(${deg} 9 9)`}
        />
      ))}
    </svg>
  );
}
