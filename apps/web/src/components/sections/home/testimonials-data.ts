/**
 * Testimonial data for the "Chosen by Engineering Leaders" carousel. Split
 * out from Testimonials.tsx (a "use client" module) so server-only code
 * (e.g. the homepage's Review schema) can import the data without crossing
 * a client-component boundary. A plain data export re-imported into a
 * Server Component from a "use client" file resolves incorrectly under
 * Turbopack's SSR bundling (`HOME_TESTIMONIALS.filter is not a function` at
 * prerender) — this module has no client dependency, so it's safe on both
 * sides.
 */

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  /** Optional logo asset (same files served from BrandMarquee). When
   *  provided, `CompanyMark` renders the wordmark image instead of the
   *  text-only orb placeholder. */
  logoSrc?: string;
  /** Optional headshot. Falls back to the shared placeholder when omitted. */
  photoSrc?: string;
  quote: string;
  caseStudyHref?: string;
}

export const HOME_TESTIMONIALS: Testimonial[] = [
  {
    name: "Mathan Babu K",
    role: "CTSO & DPO, Vodafone Idea",
    company: "Vodafone Idea",
    logoSrc: "/images/trusted/10-vi.webp",
    photoSrc: "/images/testimonials/mathan-babu-k.webp",
    quote:
      "Containers and microservices now sit at the heart of modern application delivery and the broader supply chain ecosystem. CleanStart's shift-left security approach couldn't have arrived at a more critical time.",
  },
  {
    name: "Shanker Ramrakhiani",
    role: "Head, Risk and App security, IIFL Finance",
    company: "IIFL Finance",
    logoSrc: "/images/testimonials/iifl-finance.png",
    photoSrc: "/images/testimonials/shanker-ramrakhiani.webp",
    quote:
      "CleanStart helped us standardize our container foundations without slowing development. Tasks that previously required significant manual effort are now eliminated, deployments are faster, and our security team has greater confidence in the images we use.",
    caseStudyHref: "https://cdn.cleanstart.com/case-studies/iifl-case-study.pdf",
  },
  {
    name: "Mr. Moinul Khan",
    role: "CEO, Aurascape",
    company: "Aurascape",
    logoSrc: "/images/testimonials/aurascape-logo.png",
    photoSrc: "/images/testimonials/moinul-khan.webp",
    quote:
      "Standardizing on verified container foundations gave us confidence in the base of every service we deploy and allowed us to shift security much earlier in the build process.",
    caseStudyHref: "https://cdn.cleanstart.com/case-studies/aurascape-case-study.pdf",
  },
  {
    name: "Ankit Agarwal",
    role: "VP Enterprise Architecture, Coforge",
    company: "Coforge",
    logoSrc: "/images/testimonials/coforge-logo.svg",
    quote:
      "Modern software depends on open source, but every component must be trusted before deployment. CleanStart provides the verification and assurance we need to innovate confidently while maintaining strong software supply chain security.",
  },
];
