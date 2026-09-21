/**
 * /case-studies FAQ copy. Plain data (no "use client") so the route can feed
 * the same text to `faqPageSchema` that the accordion renders. Answers are
 * plain text: the schema builder does not strip markup.
 */
export interface CaseStudyFaq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export const CASE_STUDY_FAQS: readonly CaseStudyFaq[] = [
  {
    id: "what-is-inside",
    question: "What does a CleanStart case study actually cover?",
    answer:
      "Where the team started, what they changed, and what moved. Each study names the environment, the container images in play, the work involved in the migration, and the outcomes the team measured afterwards. They are written for engineers and security leads, so they carry specifics rather than slogans.",
  },
  {
    id: "form-required",
    question: "Do I have to fill in a form to read one?",
    answer:
      "No. Every case study on this page is open, and the full PDF downloads without a form. Some of the deeper research reports in the resource centre are gated, and those are labelled where they appear.",
  },
  {
    id: "where-do-numbers-come-from",
    question: "Where do the numbers come from?",
    answer:
      "From the customer's own environment, measured before and after the migration, together with the scan and build data CleanStart produces during the engagement. We publish a figure only when the customer has reviewed and approved it, which is why some studies quote ranges rather than a single number.",
  },
  {
    id: "industries",
    question: "Which industries are represented?",
    answer:
      "Finance, healthcare, telecom and technology so far, spanning regulated enterprises and high-growth product teams. If you want a story closer to your own environment, ask us and we will point you at the nearest engagement or arrange a conversation.",
  },
  {
    id: "reference-call",
    question: "Can I speak to one of these customers?",
    answer:
      "In many cases, yes. Reference conversations are arranged individually with the customer's agreement, usually once a proof of concept is under way. Ask your CleanStart contact or book a demo and mention which story you want to hear more about.",
  },
  {
    id: "publish-anonymously",
    question: "Can we be a case study without naming our company?",
    answer:
      "Yes. Several customers publish anonymously, described by sector and scale rather than by name, and one of the studies on this page is written that way. You approve every line before anything is published, and you can withdraw consent later.",
  },
];
