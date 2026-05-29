import { HomeTestimonialsInsiders } from "@/components/sections/_shared/HomeTestimonialsInsiders";
import { INSIDERS_TESTIMONIALS } from "@/components/sections/teams/TeamsInsiders";

/**
 * Community-page testimonials section. Uses the "CleanStart Insiders"
 * light-card layout populated with the same insiders data as the /teams page.
 */
export function CommunityTestimonials() {
  return (
    <HomeTestimonialsInsiders
      reserveFooterCtaSpace
      testimonials={INSIDERS_TESTIMONIALS}
    />
  );
}
