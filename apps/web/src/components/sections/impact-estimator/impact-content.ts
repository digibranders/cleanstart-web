/*
 * Prose for the methodology and FAQ sections. Numbers that the scoring model
 * owns are not repeated here; the components read them from ./model so the
 * page cannot describe one formula while computing another.
 */

export interface ImpactFaq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export const METHOD_HEADING = "How the estimate works";

export const METHOD_INTRO =
  "The estimator is a transparent scoring model, not a black box. Four facts about your runtime become a single burden score, the score places you in a Runtime Complexity tier, and each tier carries the outcome ranges typical for environments like yours.";

export const METHOD_STEPS: ReadonlyArray<{ readonly title: string; readonly body: string }> = [
  {
    title: "Four signals are scored in bands",
    body: "Production images and engineering team size each fall into one of four size bands. Remediation frequency and release cadence each take one of three levels. Each band or level becomes a score from 1 upward.",
  },
  {
    title: "Weights turn the scores into one number",
    body: "Production images carry the most weight because every image is a surface to patch, scan and secure. The weighted scores add up to your Operational Burden Score.",
  },
  {
    title: "The score sets your tier",
    body: "The scale runs from the lowest to the highest reachable score and is cut into four Runtime Complexity tiers. Crossing a tier edge is what moves the headline figures.",
  },
  {
    title: "The tier carries the outcome ranges",
    body: "Each tier has a published range for every outcome. Sitting deeper in a tier reports proportionally stronger results within that range. Hours recovered multiply the share of a working year lost to vulnerability toil by your Vulnerability Noise Reduction and your team size.",
  },
];

export const FAQ_HEADING = "Questions about the estimate";

export const FAQ_INTRO =
  "What the numbers mean, where they come from, and what happens to the values you enter.";

export const FAQS: readonly ImpactFaq[] = [
  {
    id: "what-it-measures",
    question: "What does the Impact Estimator measure?",
    answer:
      "It measures operational burden: the vulnerability triage, patching and re-testing load that inherited base-image packages create for a team. It reports the reductions that minimal, trusted container images typically deliver for a runtime of your shape, in percentages, release multiples and engineering hours. It does not price anything, so there is no currency figure.",
  },
  {
    id: "where-numbers-come-from",
    question: "Where do the numbers come from?",
    answer:
      "The bands, weights and outcome ranges are CleanStart's operational model, built from customer environments and industry benchmarks for container vulnerability management. They describe what organizations with a comparable burden profile see. They are directional estimates, not a measurement of your images.",
  },
  {
    id: "why-jumps",
    question: "Why do the figures jump at certain slider positions?",
    answer:
      "Counts are scored in bands rather than on a continuous curve, so the burden score changes only when a slider crosses a band edge. The tick marks under each slider show where those edges sit. Inside a tier the outcome figures move smoothly with your position in that tier.",
  },
  {
    id: "hours-formula",
    question: "How are Engineering Hours Recovered calculated?",
    answer:
      "Each tier has a share of a working year that engineers lose to vulnerability toil. That share is multiplied by your Vulnerability Noise Reduction to give hours recovered per engineer per year, rounded to the nearest five, then multiplied by your team size. The full-time-engineer figure divides the total by the same working year.",
  },
  {
    id: "data-privacy",
    question: "Is anything I enter sent to CleanStart?",
    answer:
      "No. The model runs entirely in your browser and nothing is stored on a server. The only place the four inputs travel is the address bar, so a copied link reproduces the same result for a teammate. Booking a demo is a separate form that you fill in yourself.",
  },
  {
    id: "real-numbers",
    question: "How do I get numbers for my actual images?",
    answer:
      "Book a demo. CleanStart scans your real images and reports the measured vulnerability, patch and footprint reduction against the same outcome names used on this page, so the estimate and the measurement line up.",
  },
];
