/*
 * FAQ copy for the page. Answers describe the model in words only; the numbers
 * live in ./model and are not repeated here.
 */

export interface ImpactFaq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

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
