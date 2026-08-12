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
    name: "Anuj Gupta",
    role: "MD, Hitachi Systems (India)",
    quote:
      "Life is all about new beginnings - a clean slate with new friends. Hitachi Systems India is proud to partner with CleanStart to bring market a revolutionary solution delivering clean, hardened, and compliant container and VM images with zero critical vulnerabilities. CleanStart is a game-changer in software supply chain security, blending compliance, security, and innovation to solve real-world customer challenges. CleanStart is manna from heaven for the software industry.",
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
