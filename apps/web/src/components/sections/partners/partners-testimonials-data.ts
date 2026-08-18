/**
 * Partner testimonial data. Split out from PartnersTestimonials.tsx (a "use
 * client" file) so server-only code can import the data without crossing a
 * client-component boundary — see testimonials-data.ts (home) for the exact
 * Turbopack SSR-bundling failure this sidesteps.
 */

export interface PartnerQuote {
  name: string;
  role: string;
  quote: string;
}

export const PARTNER_TESTIMONIALS: PartnerQuote[] = [
  {
    name: "Abdul Rahaman Mohammad",
    role: "Chief Executive Officer, Gulf IT Network Distribution",
    quote:
      "As organizations accelerate AI-driven software development, they are building software faster while increasingly relying on open-source components and third-party code. This makes the software supply chain a rapidly expanding attack surface, where trust must advance at the same pace as innovation. Together with CleanStart, Gulf IT is helping customers build, acquire and deploy software with confidence through verified software artefacts, backed by our local expertise and regional support.",
  },
  {
    name: "Shaq Khan",
    role: "Founder & CEO, Fortfire (US)",
    quote:
      "In security, clean starts are rare but game-changing when they happen. That's why we're excited to partner with CleanStart. CleanStart™ flips the script with container and VM images that ship zero critical CVEs, fully hardened and compliance-ready. No patching marathons. No day-zero panic. Just secure infrastructure, from the jump. For modern builders, CleanStart isn't just a product — it's peace of mind baked into your pipeline. Fortfire is all-in on helping teams ship faster, safer, and smarter. CleanStart makes that possible.",
  },
  {
    name: "Kimmo Vesajoki",
    role: "CCO, NGIT (Nordic)",
    quote:
      "NGIT is proud to work with CleanStart to the Nordic marketplace. CleanStart is a groundbreaking solution that provides software developers with clean, lean, hardened, and compliant container and VM images free from critical vulnerabilities. Together we are on a mission to transform software supply chain security and help the Nordic software industry stay ahead of the game",
  },
];
