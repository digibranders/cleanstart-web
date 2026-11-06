import type React from 'react';
import { IndustryCTA } from '@/components/sections/industries/IndustryCTA';

/* Headline, supporting line and button are the brief's, verbatim. */
export function TelecomCTA(): React.ReactElement {
  return (
    <IndustryCTA
      section="TelecomCTA"
      headline="Ready to Build Carrier-Grade Software Foundations?"
      description="Discover your software estate. Standardize on verified components. Operate resilient networks with confidence."
      buttonLabel="Talk to a Security Expert"
      buttonHref="/contact-us"
    />
  );
}
