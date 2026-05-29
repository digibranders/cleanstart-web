import Image from "next/image";
import { cn } from "@/lib/cn";

// `shrink-0` + `object-contain` stop the parent flex container from squashing
// the logo below its natural aspect ratio at narrow viewports.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/images/logo-cleanstart-nav.png"
      alt="CleanStart"
      width={153}
      height={32}
      sizes="153px"
      priority
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

export function LogoMark({ className = "" }: { className?: string }) {
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
        d="M11 1.5L19.5 6.25V15.75L11 20.5L2.5 15.75V6.25L11 1.5Z"
        stroke="url(#mark-grad)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="url(#mark-fill)"
      />
      <path d="M11 11L19.5 6.25M11 11L2.5 6.25M11 11V20.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
      <defs>
        <linearGradient id="mark-grad" x1="2.5" y1="1.5" x2="19.5" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A98BFF" />
          <stop offset="1" stopColor="#5A3DF0" />
        </linearGradient>
        <linearGradient id="mark-fill" x1="2.5" y1="1.5" x2="19.5" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C5BFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#4924C0" stopOpacity="0.65" />
        </linearGradient>
      </defs>
    </svg>
  );
}
