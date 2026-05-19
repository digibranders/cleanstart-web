// Single source of truth for the marketing nav. Mirrors cleanstart.com production IA.
// Consumed by both DesktopNav and MobileNav so the desktop bar and mobile sheet never drift.
//
// Slug authority: docs/WEB-PAGES.md. All items carry their real final slug regardless of
// build status. Unbuilt items are rendered as <span> (non-clickable) — not <Link> — so
// the href is data-only until the page exists. When a page is marked ✅ in WEB-PAGES.md,
// switch its renderer from <span> to <Link> in MegaMenu / CompactDropdown / MobileNav.

export type NavLeaf = {
  label: string;
  href: string;
  description?: string;
  /** true = page is built and the item renders as a <Link>; omit or false = <span> */
  built?: boolean;
};

export type NavGroup = {
  title?: string;
  items: NavLeaf[];
};

export type NavMegaItem = {
  kind: "mega";
  label: string;
  groups: NavGroup[];
  width?: number;
};

export type NavCompactItem = {
  kind: "compact";
  label: string;
  items: NavLeaf[];
  width?: number;
};

export type NavFlatItem = {
  kind: "flat";
  label: string;
  href: string;
};

export type NavItem = NavMegaItem | NavCompactItem | NavFlatItem;

export const NAV_TREE: NavItem[] = [
  {
    kind: "mega",
    label: "Products",
    width: 520,
    groups: [
      {
        items: [
          {
            label: "CleanStart Images",
            href: "/cleanstart-images",
            description: "Hardened, minimal container images with near-zero CVEs.",
          },
          {
            label: "CleanStart SBOM",
            href: "/software-bill-materials",
            description: "Signed SBOMs and provenance for every artifact you ship.",
            built: true,
          },
          {
            label: "CleanSight",
            href: "/cleansight",
            description: "Runtime visibility into vulnerabilities and drift.",
            built: true,
          },
        ],
      },
    ],
  },
  {
    kind: "mega",
    label: "Solutions",
    width: 560,
    groups: [
      {
        items: [
          {
            label: "FIPS Compliance",
            href: "/fips",
            description: "FIPS 140-3 validated cryptography across your stack.",
            built: true,
          },
          {
            label: "Enhance SCA",
            href: "/software-composition-analysis",
            description: "Cut SCA noise with cleaner base images and signed SBOMs.",
          },
          {
            label: "Vulnerability Remediation",
            href: "/vulnerability-remediation",
            description: "Patch upstream once, ship hardened downstream everywhere.",
            built: true,
          },
          {
            label: "Attack Surface Reduction",
            href: "/attack-surface-reduction",
            description: "Distroless-style minimal images shrink your blast radius.",
            built: true,
          },
        ],
      },
    ],
  },
  {
    kind: "compact",
    label: "Audience",
    width: 260,
    items: [
      { label: "For Developers", href: "/for-developers" },
      { label: "For CISO", href: "/for-ciso" },
    ],
  },
  {
    kind: "mega",
    label: "Resources",
    width: 520,
    groups: [
      {
        title: "Insights",
        items: [
          { label: "Blogs", href: "/blogs", built: true },
          { label: "Resource Center", href: "/resource-center", built: true },
          { label: "Newsroom", href: "/news", built: true },
          { label: "Knowledge Hub", href: "/knowledge-hub/vex-documents", built: true },
        ],
      },
      {
        title: "Events",
        items: [
          { label: "In-Person Events", href: "/events", built: true },
          { label: "Webinars", href: "/webinars", built: true },
          { label: "Podcast", href: "/podcast", built: true },
        ],
      },
    ],
  },
  {
    kind: "compact",
    label: "Company",
    width: 260,
    items: [
      { label: "About Us", href: "/about-us", built: true },
      { label: "Teams", href: "/teams" },
      { label: "Community", href: "/community" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact-us" },
    ],
  },
  { kind: "flat", label: "Pricing", href: "/pricing" },
  { kind: "flat", label: "Partners", href: "/partners" },
];
