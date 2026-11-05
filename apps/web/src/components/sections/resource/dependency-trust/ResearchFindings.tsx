import { Reveal } from "@/components/ui/Reveal";

import { FINDINGS } from "./content";
import { FindingsStory } from "./FindingsStory";
import { GradientTitle, PageSection } from "./parts";

export function ResearchFindings(): React.ReactElement {
  return (
    <PageSection dataSection="ResearchFindings" tone="light">
      <Reveal header>
        <GradientTitle text={FINDINGS.heading} accent="reveals" tone="light" />
      </Reveal>
      <div className="mt-12 lg:mt-20">
        <FindingsStory items={FINDINGS.items} tone="light" />
      </div>
    </PageSection>
  );
}
