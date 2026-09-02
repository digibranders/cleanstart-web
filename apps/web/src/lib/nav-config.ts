// Single source of truth for the marketing nav. Mirrors cleanstart.com production IA.
// Consumed by both DesktopNav and MobileNav so the desktop bar and mobile sheet never drift.
//
// Slug authority: docs/web/WEB-PAGES.md. All items carry their real final slug regardless of
// build status. Unbuilt items are rendered as <span> (non-clickable) — not <Link> — so
// the href is data-only until the page exists. When a page is marked ✅ in WEB-PAGES.md,
// switch its renderer from <span> to <Link> in MegaMenu / MobileNav.

export type NavLeaf = {
  label: string;
  href: string;
  description?: string;
  /** Default true. Set false to mark unbuilt — renders as aria-disabled span. */
  built?: boolean;
  /** Glyph id from icons/glyphs.ts. Required for mega items in PanelRow. */
  icon?: string;
};

export type NavGroup = {
  title?: string;
  items: NavLeaf[];
};

export type NavMegaItem = {
  kind: "mega";
  label: string;
  /** Required. Shown under the eyebrow in PanelHeader. */
  tagline: string;
  /** Required. Drives the accent color on eyebrow, link, and featured-tile border. NOT used for background tinting. */
  accent: "cyan" | "green" | "purple" | "magenta";
  groups: NavGroup[];
  width?: number;
  /**
   * Optional right-aligned exit-link in PanelHeader. **Set both or neither** — half-populated
   * pairs are a bug. Only set when the destination is genuinely different from what the panel
   * already shows.
   * Products → images.cleanstart.com (live catalog of 100+ images).
   * Company → mailto:careers@cleanstart.com.
   * Solutions / Audience / Resources have NO exit link.
   */
  exitHref?: string;
  exitLabel?: string;
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
  /** Default true. Set false to mark unbuilt. */
  built?: boolean;
};

export type NavItem = NavMegaItem | NavCompactItem | NavFlatItem;

export const NAV_TREE: NavItem[] = [
  {
    kind: "mega",
    label: "Products",
    tagline: "Hardened images, signed provenance, runtime visibility.",
    accent: "cyan",
    exitHref: "https://images.cleanstart.com",
    exitLabel: "Browse all images",
    groups: [
      {
        items: [
          {
            label: "Clean Images",
            href: "/cleanstart-images",
            description: "Hardened base images. Near-zero CVEs.",
            icon: "container",
          },
          {
            label: "Clean Libraries",
            href: "/clean-libraries",
            description: "Govern every dependency, including AI-introduced libraries.",
            icon: "library",
          },
          {
            label: "CleanSight",
            href: "/cleansight",
            description: "Runtime visibility into vulnerabilities and drift.",
            icon: "radar",
          }
        ],
      },
    ],
  },
  {
    kind: "mega",
    label: "Solutions",
    tagline: "FIPS compliance, vulnerability remediation, minimal attack surface.",
    accent: "green",
    width: 760,
    groups: [
      {
        title: "Capability",
        items: [
          {
            label: "Vulnerability Remediation",
            href: "/vulnerability-remediation",
            description: "Patch upstream once, ship hardened downstream everywhere.",
            icon: "refresh",
          },
          {
            label: "Attack Surface Reduction",
            href: "/attack-surface-reduction",
            description: "Minimal images. Smaller blast radius.",
            icon: "minimize",
          },
          {
            label: "ROI Calculator",
            href: "/roi-calculator",
            description: "Estimate the operational impact of hardened images.",
            icon: "radar",
            built: false,
          },
        ],
      },
      {
        title: "Compliance",
        items: [
          {
            label: "FIPS Compliance",
            href: "/fips",
            description: "Drop-in FIPS 140-3 validated crypto.",
            icon: "shield-check",
          },
          {
            label: "Verifiable SBOMs",
            href: "/software-bill-materials",
            description: "Signed SBOMs. Provenance for every artifact.",
            icon: "doc-signed",
          },
        ],
      },
      {
        title: "By role",
        items: [
          {
            label: "For Developers",
            href: "/for-developers",
            description: "Hardened base images, signed SBOMs, and zero workflow friction.",
            icon: "tools",
          },
          {
            label: "For CISO",
            href: "/for-ciso",
            description: "Provable supply-chain integrity, audit-ready, and FIPS where you need it.",
            icon: "hash",
          },
        ],
      },
      {
        // Both /industries/* pages are live: indexable and listed in the sitemap.
        //
        // Labels stay short. The pages are titled "Container Security for
        // Financial Services" / "... for SaaS Companies" for search, but the nav
        // is navigation, not a ranking surface, and the group heading already
        // says "By industry".
        title: "By industry",
        items: [
          {
            label: "Financial Services",
            href: "/industries/financial-services-container-security",
            description: "Verified components for regulated financial software.",
            icon: "bank",
          },
          {
            label: "Modern Applications",
            href: "/industries/modern-applications",
            description: "Ship faster on a verified software foundation.",
            icon: "cloud",
          },
        ],
      },
    ],
  },
  {
    kind: "mega",
    label: "Resources",
    tagline: "Articles, advisories, talks, and events.",
    accent: "cyan", // intentional: Products + Resources both use cyan per design spec §4
    groups: [
      {
        title: "Insights",
        items: [
          { label: "Blogs", href: "/blogs", icon: "book" },
          { label: "Guides", href: "/guide", icon: "tools" },
          { label: "Resource Center", href: "/resource-center", icon: "folder" },
          { label: "Case Studies", href: "/case-studies", icon: "doc-signed" },
          { label: "Newsroom", href: "/news", icon: "newspaper" },
          { label: "Knowledge Hub", href: "/knowledge-hub", icon: "book-open" },
        ],
      },
      {
        title: "Events",
        items: [
          { label: "Events", href: "/events", icon: "calendar" },
          { label: "Webinars", href: "/webinars", icon: "play" },
          { label: "Podcast", href: "/podcast", icon: "mic" },
        ],
      },
    ],
  },
  {
    kind: "mega",
    label: "Company",
    tagline: "The team rebuilding the base layer of open source.",
    accent: "magenta",
    exitHref: "mailto:careers@cleanstart.com",
    exitLabel: "careers@",
    groups: [
      {
        items: [
          { label: "About Us", href: "/about-us", description: "Why we started, where we're going.", icon: "info" },
          { label: "Teams", href: "/teams", description: "The engineers, designers, and operators behind it.", icon: "users" },
          { label: "Community", href: "/community", description: "Open builds, public discussions, contributor program.", icon: "network" },
          { label: "Careers", href: "/careers", description: "Hiring engineers, SEs, and designers.", icon: "star" },
          { label: "Contact Us", href: "/contact-us", description: "Sales, support, partnerships, press.", icon: "mail" },
        ],
      },
    ],
    width: 760,
  },
  { kind: "flat", label: "Partners", href: "/partners" },
  { kind: "flat", label: "Pricing", href: "/pricing" },
];
