import type React from 'react';
import { IndustryCTA } from '@/components/sections/industries/IndustryCTA';

/*
 * DESCRIPTION is the one string on this page not taken from the client
 * proposal, which supplies a headline and a button for this card and nothing
 * else. Without it the content block came to 89px in a 260px card and left the
 * cube stranded in dead space. Flag it for client sign-off.
 */
export function FinanceCTA(): React.ReactElement {
  return (
    <IndustryCTA
      section="FinanceCTA"
      headline="Build Trusted Financial Software with CleanStart"
      description="Talk through your compliance requirements and see how verified components fit your existing stack."
      buttonLabel="Talk to a Security Expert"
      buttonHref="/contact-us"
    />
  );
}
