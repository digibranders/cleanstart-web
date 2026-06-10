import Link from "next/link";
import { DesktopNav } from "@/components/nav/DesktopNav";
import { MobileNav } from "@/components/nav/MobileNav";
import { HeaderScrollShell } from "@/components/nav/HeaderScrollShell";
import { fetchLatestImages } from "@/components/nav/data/latest-images";
import { fetchLatestUpdates } from "@/components/nav/data/latest-updates-feed";
import {
  getResourcesSpotlight,
  getCompanySpotlight,
} from "@/components/nav/data/resolve-spotlights";
import { fetchOpenRolesCount } from "@/components/nav/data/careers-feed";

export async function Header() {
  const [
    latestImages,
    latestUpdates,
    resourcesSpotlight,
    companySpotlight,
    openRolesCount,
  ] = await Promise.all([
    fetchLatestImages(),
    fetchLatestUpdates(),
    getResourcesSpotlight(),
    getCompanySpotlight(),
    fetchOpenRolesCount(),
  ]);

  return (
    <HeaderScrollShell>
      <Link
        href="/"
        aria-label="CleanStart home"
        className="flex shrink-0 items-center text-white outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#33BAEC] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-logo.png"
          alt="CleanStart"
          width={153}
          height={32}
          loading="eager"
          decoding="async"
          className="h-7 w-auto object-contain"
        />
      </Link>

      <DesktopNav
        latestImages={latestImages}
        latestUpdates={latestUpdates}
        resourcesSpotlight={resourcesSpotlight}
        companySpotlight={companySpotlight}
        openRolesCount={openRolesCount}
      />

      <div className="flex items-center gap-3">
        {/* Wrapper hides the CTAs below lg: .cs-btn-* set display:inline-flex as
            unlayered CSS that overrides Tailwind's `hidden`, so the parent's
            display:none is what actually hides them on mobile (CTAs live in the
            mobile menu footer instead). */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/contact-us"
            className="cs-btn-blue"
            style={{
              ["--cs-btn-h" as string]: "36px",
              ["--cs-btn-px" as string]: "16px",
              ["--cs-btn-fs" as string]: "13px",
            }}
          >
            Contact Us
          </Link>
          <Link
            href="/book-a-demo"
            className="cs-btn-glass"
            style={{
              ["--cs-btn-h" as string]: "36px",
              ["--cs-btn-px" as string]: "16px",
              ["--cs-btn-fs" as string]: "13px",
            }}
          >
            Book a Demo
          </Link>
        </div>
        <MobileNav />
      </div>
    </HeaderScrollShell>
  );
}
