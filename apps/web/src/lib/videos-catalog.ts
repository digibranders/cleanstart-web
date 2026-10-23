/**
 * Editorial layer for /videos. The CleanStart YouTube feed only returns the
 * newest 15 uploads and carries no duration, format or topics, so each video
 * that has been classified lives here with its permanent URL slug. A new upload
 * appears on the site automatically (see `lib/videos.ts`) and is filed under
 * "All" until an entry is added for it.
 *
 * Slugs are URL commitments: never rename one after launch.
 */

export type VideoFormat = "explainer" | "demo" | "talk";

export const VIDEO_FORMATS: ReadonlyArray<{
  readonly id: VideoFormat;
  readonly label: string;
  readonly singular: string;
}> = [
  { id: "explainer", label: "Explainers", singular: "Explainer" },
  { id: "demo", label: "Product demos", singular: "Product demo" },
  { id: "talk", label: "Talks and webinars", singular: "Talk" },
];

export const VIDEO_TOPICS = [
  { id: "base-images", label: "Base images" },
  { id: "attack-surface", label: "Attack surface" },
  { id: "cves", label: "CVEs" },
  { id: "supply-chain", label: "Supply chain" },
  { id: "sbom", label: "SBOM" },
  { id: "vex", label: "VEX" },
  { id: "provenance", label: "Provenance" },
  { id: "dependencies", label: "Dependencies" },
  { id: "posture", label: "Security posture" },
  { id: "container-sprawl", label: "Container sprawl" },
  { id: "ai", label: "AI" },
] as const;

export type VideoTopicId = (typeof VIDEO_TOPICS)[number]["id"];

export interface CatalogVideo {
  /** 11-character YouTube video id. */
  readonly id: string;
  readonly slug: string;
  /** Display title. Wins over the YouTube title, so editors can tidy it here. */
  readonly title: string;
  readonly format: VideoFormat;
  readonly topics: readonly VideoTopicId[];
  /** ISO-8601, copied from the YouTube upload. */
  readonly publishedAt: string;
  readonly durationSeconds: number;
  /** First paragraph of the YouTube description. Card blurb and meta description. */
  readonly summary: string;
  /** Videos uploaded without a 1280x720 frame fall back to the 4:3 frame. */
  readonly thumb?: "maxres" | "hq";
}

export const VIDEO_CATALOG: readonly CatalogVideo[] = [
  {
    id: "uBItoX-x7Do",
    slug: "what-is-vex",
    title: "What Is VEX? How It Tells Which Vulnerabilities Matter",
    format: "explainer",
    topics: ["vex", "sbom", "cves"],
    publishedAt: "2026-10-13T14:17:14+00:00",
    durationSeconds: 101,
    summary:
      "A vulnerability scanner can flag hundreds of CVEs in a single container image, and some of them can’t be exploited where you run it. VEX (Vulnerability Exploitability eXchange) is how a software supplier tells you which ones apply.",
  },
  {
    id: "m9olMTM72tI",
    slug: "sboms-explained",
    title: "SBOMs Explained: What They Tell You and What They Don’t",
    format: "explainer",
    topics: ["sbom", "provenance"],
    publishedAt: "2026-10-12T10:58:15+00:00",
    durationSeconds: 113,
    summary:
      "A critical CVE drops. Is that component in your container image at all? An SBOM answers that in seconds. Whether it puts you at risk is a separate question, and this 2-minute explainer covers both.",
  },
  {
    id: "UViY8slB4G8",
    slug: "clean-libraries-ide-demo",
    title: "Clean Libraries Demo: Scan and Fix Vulnerabilities in Your IDE",
    format: "demo",
    topics: ["dependencies", "cves"],
    publishedAt: "2026-09-25T05:19:56+00:00",
    durationSeconds: 188,
    summary:
      "See Clean Libraries in action inside VS Code. As you code, it scans your project dependencies for known vulnerabilities and flags risky libraries directly in the IDE.",
  },
  {
    id: "80ofihytgDk",
    slug: "software-supply-chain-security-in-the-age-of-ai",
    title: "Software Supply Chain Security in the Age of AI",
    format: "talk",
    topics: ["supply-chain", "ai"],
    publishedAt: "2026-09-21T18:06:01+00:00",
    durationSeconds: 1666,
    summary:
      "In this episode of CleanStart Conversations, Ankit Aggarwal, VP, Enterprise Architecture at Coforge, joins us to discuss the growing challenges of software supply chain security in the age of AI.",
  },
  {
    id: "dQpZX5vMgqk",
    slug: "what-is-container-sprawl",
    title: "What Is Container Sprawl?",
    format: "explainer",
    topics: ["container-sprawl", "posture"],
    publishedAt: "2026-09-11T03:47:39+00:00",
    durationSeconds: 98,
    summary:
      "Container sprawl occurs when container images grow faster than teams can track, secure, and manage them. This video explains the causes of container sprawl, its impact on container security, and why visibility across registries, clusters, and running workloads matters.",
  },
  {
    id: "nh4n-o_ulvk",
    slug: "meet-cubr",
    title: "Meet CUBR, Your Guide to Trusted Software",
    format: "demo",
    topics: ["supply-chain", "provenance"],
    publishedAt: "2026-07-30T10:27:29+00:00",
    durationSeconds: 105,
    summary:
      "Forged from precision, powered by trust, and built on the principles of secure-by-design, CUBR represents CleanStart's vision for a safer software supply chain.",
  },
  {
    id: "Il4uk_RPD5M",
    slug: "clean-libraries-secure-dependencies",
    title: "Clean Libraries: Secure Software Dependencies at the Source",
    format: "demo",
    topics: ["dependencies", "supply-chain"],
    publishedAt: "2026-07-24T09:56:59+00:00",
    durationSeconds: 159,
    summary:
      "Every release introduces hundreds of dependencies, including transitive packages and AI-generated libraries. Without verification, untrusted components become part of your software supply chain.",
    thumb: "hq",
  },
  {
    id: "6T3PGeattMI",
    slug: "what-is-provenance-in-containers",
    title: "What Is Provenance in Containers?",
    format: "explainer",
    topics: ["provenance", "supply-chain", "sbom"],
    publishedAt: "2026-07-09T04:16:00+00:00",
    durationSeconds: 89,
    summary:
      "Container provenance is a verifiable record of where a container image came from and how it was built. This video explains what provenance captures, why most images don't include it, and how a signed record lets you catch tampering before an image reaches production.",
  },
  {
    id: "81vUYFBS-dY",
    slug: "public-vs-hardened-vs-cleanstart-images",
    title: "Public vs Hardened vs CleanStart Images",
    format: "explainer",
    topics: ["base-images", "attack-surface"],
    publishedAt: "2026-07-02T18:47:00+00:00",
    durationSeconds: 153,
    summary:
      "Every container starts with a base image, but not all base images are built the same. This video compares Public Images, Hardened Images, and CleanStart Source-Built Images to show how image composition impacts vulnerabilities, attack surface, and trust.",
  },
  {
    id: "92d9bzMUoI4",
    slug: "base-images-explained",
    title: "Base Images Explained in 60 Seconds",
    format: "explainer",
    topics: ["base-images"],
    publishedAt: "2026-06-24T20:23:34+00:00",
    durationSeconds: 59,
    summary:
      "A base image is the foundation that everything else is built on, from dependencies to application code. In this 60-second explainer, discover what a base image is and why choosing the right one matters.",
  },
  {
    id: "1pPSjboIzoU",
    slug: "what-is-a-shell-less-container",
    title: "What Is a Shell-Less Container? Container Security Decoded",
    format: "explainer",
    topics: ["attack-surface", "base-images"],
    publishedAt: "2026-06-10T12:14:14+00:00",
    durationSeconds: 131,
    summary:
      "Most production containers ship with a shell they never use. It sits inside the runtime as convenience tooling, and it quietly becomes one of the easiest paths for an attacker to turn a single vulnerability into full operational control.",
  },
  {
    id: "GqFPH4KKqpA",
    slug: "cleansight-software-security-posture-management",
    title: "CleanSight: Complete Software Security Posture Management",
    format: "demo",
    topics: ["posture", "cves"],
    publishedAt: "2026-05-27T13:36:30+00:00",
    durationSeconds: 73,
    summary:
      "Introducing CleanSight, a complete Software Security Posture Management platform designed to give you unified visibility across your infrastructure, clusters, and containers.",
  },
  {
    id: "juh9IYHXXZA",
    slug: "cve-fatigue-explained",
    title: "CVE Fatigue Explained: Why Your Vulnerability Backlog Never Gets Shorter",
    format: "explainer",
    topics: ["cves", "base-images"],
    publishedAt: "2026-05-22T04:46:17+00:00",
    durationSeconds: 154,
    summary:
      "2,000 CVEs flagged. Your team patches, rebuilds, redeploys. Next week: 500 more. The cycle repeats. This video breaks down what CVE fatigue is, where it actually comes from, and how teams escape it.",
  },
  {
    id: "neWpaEOf3XM",
    slug: "busybox-in-containers",
    title: "BusyBox in Containers: The Risk Nobody Talks About",
    format: "explainer",
    topics: ["attack-surface", "base-images"],
    publishedAt: "2026-05-13T12:55:14+00:00",
    durationSeconds: 117,
    summary:
      "BusyBox ships in 85% of lightweight container images. A single C binary from 1996, bundling 300+ utilities into one executable. 47 CVEs in five years. Nobody on your team installed it. Nobody reviewed it. It just showed up.",
  },
  {
    id: "WvxSvEzXbiQ",
    slug: "what-is-attack-surface-in-containers",
    title: "What Is Attack Surface in Containers?",
    format: "explainer",
    topics: ["attack-surface", "base-images"],
    publishedAt: "2026-04-30T06:56:26+00:00",
    durationSeconds: 160,
    summary:
      "Your container image has hundreds of packages. How many does your application actually need? Probably fewer than you think, and every extra one is a potential vulnerability.",
  },
];
