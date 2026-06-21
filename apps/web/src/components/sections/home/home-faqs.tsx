import type React from "react";

/**
 * Single source of truth for the home-page FAQ content.
 *
 * The interactive accordion (`FrequentlyAskedQuestions.tsx`, a client component)
 * renders the rich `a` nodes; the home page (a server component) emits
 * `faqPageSchema(HOME_FAQ_ITEMS)` for AEO / answer-engine extraction. Keeping the
 * data here — outside the `"use client"` boundary — lets both import it without
 * the answers drifting apart.
 */

export interface FaqItem {
  id: string;
  q: string;
  a: React.ReactNode;
}

export const LEFT_FAQS: FaqItem[] = [
  {
    id: "what-is",
    q: "What is CleanStart?",
    a: (
      <>
        CleanStart provides hardened, near-zero-CVE{" "}
        <a
          href="/cleanstart-images"
          className="font-medium text-[#3960F9] underline-offset-2 hover:underline"
        >
          container base images
        </a>{" "}
        that are continuously scanned, rebuilt, and cryptographically signed.
        Our images are designed to eliminate known vulnerabilities at the
        source, giving your team secure foundations to build on.
      </>
    ),
  },
  {
    id: "security-updates",
    q: "How does CleanStart handle security updates?",
    a: "CleanStart images are updated regularly, with signed attestations and SBOMs for every release, ensuring transparency and traceability.",
  },
  {
    id: "customize",
    q: "Can I customize CleanStart images for my applications?",
    a: "Yes — CleanStart provides curated base images, allowing you to securely build custom containers that match your unique application needs while maintaining a minimal, secure footprint.",
  },
];

export const RIGHT_FAQS: FaqItem[] = [
  {
    id: "verify",
    q: "How can I verify a CleanStart image?",
    a: "Each CleanStart image comes with attestation, signed and SBOM files. You can verify their integrity using standard container tools or CleanStart's verification utilities.",
  },
  {
    id: "registries",
    q: "Which registries work with CleanStart images?",
    a: "CleanStart images are compatible with popular registries like Docker Hub, GitHub Container Registry, and private enterprise registries. We also support authenticated access for secured environments.",
  },
  {
    id: "compliance",
    q: "Does CleanStart support compliance frameworks like FIPS or NIST?",
    a: "Yes — CleanStart maintains a dedicated set of FIPS-compliant container images for industries with strict security and compliance requirements.",
  },
];

// Plain-text answer twins for the FAQPage schema. Answers that are already
// strings are used verbatim; `what-is` is JSX (it carries an inline link), so
// its plain-text version lives here — keep it in sync with the JSX above.
const PLAIN_ANSWERS: Record<string, string> = {
  "what-is":
    "CleanStart provides hardened, near-zero-CVE container base images that are continuously scanned, rebuilt, and cryptographically signed. Our images are designed to eliminate known vulnerabilities at the source, giving your team secure foundations to build on.",
};

/** Plain-text Q&A pairs for `faqPageSchema` (FAQPage requires string answers). */
export const HOME_FAQ_ITEMS: ReadonlyArray<{ question: string; answer: string }> = [
  ...LEFT_FAQS,
  ...RIGHT_FAQS,
].map((f) => ({
  question: f.q,
  answer: typeof f.a === "string" ? f.a : (PLAIN_ANSWERS[f.id] ?? ""),
}));
