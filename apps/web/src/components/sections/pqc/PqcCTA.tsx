import type React from 'react';
import { IndustryCTA } from '@/components/sections/industries/IndustryCTA';

/* Headline, supporting line and both button labels are the brief's, verbatim. */
export function PqcCTA(): React.ReactElement {
  return (
    <IndustryCTA
      section="PqcCTA"
      headline="Ready for What’s Next?"
      description="Build on hardened, verifiable software foundations with CleanStart."
      buttonLabel="Explore Clean Images"
      buttonHref="/cleanstart-images"
      secondaryLabel="Talk to Our Team"
      secondaryHref="/contact-us"
    />
  );
}
