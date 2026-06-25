import Image from "next/image";
import { cn } from "@/lib/cn";

// `shrink-0` + `object-contain` stop the parent flex container from squashing
// the logo below its natural aspect ratio at narrow viewports.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/images/cleanstart-logo.png"
      alt="CleanStart"
      width={153}
      height={32}
      sizes="153px"
      priority
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

// Official CleanStart crystal mark (same cube geometry as the navbar logo /
// favicon) in the brand cyan→blue. Replaces the earlier off-brand purple mark.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 27.7958 31.9969"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M24.2359 10.3234V22.0554L15.709 27.1983V15.2722L12.3945 17.1973L12.4877 17.2505V31.1486L13.898 31.9969L27.7958 23.8114V8.32319L27.7368 8.28876L24.2359 10.3234Z"
        fill="url(#cs-mark-grad)"
      />
      <path
        d="M15.7088 15.219L5.10062 8.92732L14.0283 3.991L24.2326 9.87577V10.3203L27.7335 8.28563L13.8295 0L0 8.32006V23.6079L3.22439 25.5518V11.7695L12.3943 17.1942L15.7088 15.2691V15.219Z"
        fill="url(#cs-mark-grad)"
      />
      <defs>
        <linearGradient id="cs-mark-grad" x1="0" y1="0" x2="27.8" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#36C9F2" />
          <stop offset="1" stopColor="#1B8FE6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
