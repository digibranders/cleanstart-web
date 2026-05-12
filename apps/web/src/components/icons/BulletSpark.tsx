export function BulletSpark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M10 0L11.6 7.4L19 9L11.6 10.6L10 18L8.4 10.6L1 9L8.4 7.4L10 0Z"
        fill="url(#spark-grad)"
      />
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B5BFF" />
          <stop offset="1" stopColor="#3DA9FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
