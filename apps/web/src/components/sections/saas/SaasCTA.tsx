import type React from 'react';
import { IndustryCTA } from '@/components/sections/industries/IndustryCTA';

/* Every string here is the proposal's: headline, supporting line and button. */
export function SaasCTA(): React.ReactElement {
  return (
    <IndustryCTA
      section="SaasCTA"
      headline="Secure Your Next Release Before It Ships"
      description="Give developers verified software components that integrate into existing workflows."
      buttonLabel="Talk to an Expert"
      buttonHref="/contact-us"
    />
  );
}
