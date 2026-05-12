export function CubeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M11 1L20 5.5V14.5L11 19L2 14.5V5.5L11 1Z"
        stroke="url(#cube-grad)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M2 5.5L11 10L20 5.5" stroke="url(#cube-grad)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 19V10" stroke="url(#cube-grad)" strokeWidth="1.4" />
      <defs>
        <linearGradient id="cube-grad" x1="2" y1="1" x2="20" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5BB7FF" />
          <stop offset="1" stopColor="#2B74E0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
