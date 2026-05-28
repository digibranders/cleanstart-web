import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { DesktopNav } from "@/components/nav/DesktopNav";
import { MobileNav } from "@/components/nav/MobileNav";
import { HeaderScrollShell } from "@/components/nav/HeaderScrollShell";
import { fetchLatestImages } from "@/components/nav/data/latest-images";

export async function Header() {
  const latestImages = await fetchLatestImages();
  return (
    <HeaderScrollShell>
      <Link
        href="/"
        aria-label="CleanStart home"
        className="flex shrink-0 items-center text-white outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#33BAEC] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        <Logo className="h-7 w-auto" />
      </Link>

      <DesktopNav latestImages={latestImages} />

      <div className="flex items-center gap-3">
        <Link
          href="/book-a-demo"
          className="cs-btn-glass hidden lg:inline-flex"
          style={{
            ["--cs-btn-h" as string]: "36px",
            ["--cs-btn-px" as string]: "16px",
            ["--cs-btn-fs" as string]: "13px",
          }}
        >
          Book a Demo
        </Link>
        <MobileNav />
      </div>
    </HeaderScrollShell>
  );
}
