import { Reveal } from "@/components/ui/Reveal";

import { FINDINGS } from "./content";
import { FindingsStory } from "./FindingsStory";
import { DarkSection, GradientTitle } from "./parts";

export function ResearchFindings(): React.ReactElement {
  return (
    <DarkSection dataSection="ResearchFindings">
      <Reveal header>
        <GradientTitle text={FINDINGS.heading} accent="reveals" />
      </Reveal>
      <div className="mt-12 lg:mt-20">
        <FindingsStory items={FINDINGS.items} />
      </div>
    </DarkSection>
  );
}
