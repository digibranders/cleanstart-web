// Single source of truth for the marketing nav. Mirrors cleanstart.com production IA.
// Consumed by both DesktopNav and MobileNav so the desktop bar and mobile sheet never drift.
//
// All hrefs point to "/" for now — sub-pages haven't been built yet. When a section
// page lands, swap its href in this file and both desktop + mobile nav pick it up.

export type NavLeaf = {
  label: string;
  href: string;
  description?: string;
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

const HOME = "/";

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
            href: HOME,
            description: "Hardened, minimal container images with near-zero CVEs.",
          },
          {
            label: "CleanStart SBOM",
            href: HOME,
            description: "Signed SBOMs and provenance for every artifact you ship.",
          },
          {
            label: "CleanSight",
            href: HOME,
            description: "Runtime visibility into vulnerabilities and drift.",
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
            href: HOME,
            description: "FIPS 140-3 validated cryptography across your stack.",
          },
          {
            label: "Enhance SCA",
            href: HOME,
            description: "Cut SCA noise with cleaner base images and signed SBOMs.",
          },
          {
            label: "Vulnerability Remediation",
            href: HOME,
            description: "Patch upstream once, ship hardened downstream everywhere.",
          },
          {
            label: "Attack Surface Reduction",
            href: HOME,
            description: "Distroless-style minimal images shrink your blast radius.",
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
      { label: "For Developers", href: HOME },
      { label: "For CISO", href: HOME },
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
          { label: "Blogs", href: HOME },
          { label: "Resource Center", href: HOME },
          { label: "Newsroom", href: HOME },
          { label: "Knowledge Hub", href: HOME },
        ],
      },
      {
        title: "Events",
        items: [
          { label: "In-Person Events", href: HOME },
          { label: "Webinars", href: HOME },
          { label: "Podcast", href: HOME },
        ],
      },
    ],
  },
  {
    kind: "compact",
    label: "Company",
    width: 260,
    items: [
      { label: "About Us", href: HOME },
      { label: "Teams", href: HOME },
      { label: "Community", href: HOME },
      { label: "Careers", href: HOME },
      { label: "Contact Us", href: HOME },
    ],
  },
  { kind: "flat", label: "Pricing", href: HOME },
  { kind: "flat", label: "Partners", href: HOME },
];
