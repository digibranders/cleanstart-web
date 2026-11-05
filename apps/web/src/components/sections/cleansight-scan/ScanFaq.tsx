import { PlusIcon } from "lucide-react";

import { CONTAINER_STYLE, SectionHeading, TERM_STYLE, TEXT_STYLE } from "./scan-ui";

const FAQS: readonly { question: string; answer: string }[] = [
  { question: "Is the scan really free?", answer: "Yes." },
  { question: "Do I need to install anything?", answer: "No agents are required." },
  {
    question: "How long does it take?",
    answer: "Your report is ready within minutes of connecting your environment.",
  },
  {
    question: "What happens after the scan?",
    answer:
      "You keep the report. If you’d like help acting on it, our team can walk you through the remediation plan.",
  },
  {
    question: "Does the scan fix a LiteLLM credential leak?",
    answer:
      "No. If any environment ran the compromised LiteLLM release, rotate every secret it could reach. Replacing the image removes the malicious code, but it can’t undo credentials that were already stolen.",
  },
];

export function ScanFaq(): React.ReactElement {
  return (
    <div
      className="relative mx-auto"
      style={{
        ...CONTAINER_STYLE,
        paddingTop: "clamp(48px, 6vw, 96px)",
        paddingBottom: "clamp(56px, 7vw, 112px)",
      }}
    >
      <SectionHeading>Frequently asked questions</SectionHeading>
      <div className="mt-6 max-w-[820px] divide-y divide-[#E6E8F4] border-y border-[#E6E8F4]">
        {FAQS.map(({ question, answer }) => (
          <details key={question} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-[8px] py-4 outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-[#3960F9] [&::-webkit-details-marker]:hidden">
              <span style={TERM_STYLE}>{question}</span>
              <PlusIcon
                aria-hidden
                className="size-5 shrink-0 text-[#2F49E5] transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
              />
            </summary>
            <p className="max-w-[68ch] pb-4" style={TEXT_STYLE}>
              {answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
