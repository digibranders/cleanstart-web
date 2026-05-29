import { GENERATED_ARTICLES } from "./kh-articles.data";

export type Block =
  | { type: "heading"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; text: string };

export interface Article {
  slug: string;
  title: string;
  category: string;
  lead: string;
  blocks: Block[];
  customBody?: boolean;
}

export interface SidebarItem {
  label: string;
  slug: string;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export const SIDEBAR_PANEL = "Cleanstart Platform";

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "Emerging Standards",
    items: [{ label: "VEX documents", slug: "vex-documents" }],
  },
  {
    label: "Security features",
    items: [
      { label: "Keyless Container", slug: "keyless-container" },
      { label: "Rekor Publishing", slug: "rekor-publishing" },
      { label: "Vulnerability monitoring", slug: "vulnerability-monitoring" },
    ],
  },
  {
    label: "Compliance and Certification",
    items: [{ label: "Automated Attestation", slug: "automated-attestation" }],
  },
  {
    label: "DevOps Kyverno",
    items: [
      { label: "Attestation-Based", slug: "attestation-based" },
      { label: "Generate SLSA", slug: "generate-slsa" },
      { label: "Runtime Evidence", slug: "runtime-evidence" },
    ],
  },
];

const VEX_ARTICLE: Article = {
  slug: "vex-documents",
  title:
    "How to Use VEX Documents to Suppress Non-Exploitable CVEs in Your Pipeline",
  category: "Emerging Standards",
  lead: "CleanStart addresses several critical challenges that plague traditional container security approaches.",
  blocks: [],
  customBody: true,
};

export const ARTICLES: Record<string, Article> = {
  "vex-documents": VEX_ARTICLE,
  ...GENERATED_ARTICLES,
};

export const ARTICLE_SLUGS: string[] = SIDEBAR_GROUPS.flatMap((group) =>
  group.items.map((item) => item.slug),
);

export function getArticle(slug: string): Article | undefined {
  return ARTICLES[slug];
}
