import {
  HomeTestimonialsInsiders,
  type HomeTestimonialsInsidersProps,
} from "@/components/sections/_shared/HomeTestimonialsInsiders";
import type { Testimonial } from "@/components/sections/home/Testimonials";

export const INSIDERS_TESTIMONIALS: Testimonial[] = [
  {
    name: "Pooja Lachhwani",
    role: "HR Manager",
    company: "CleanStart",
    photoSrc: "/images/testimonials/pooja-lachhwani.webp",
    quote:
      "Great products are born from understanding people, not just technology. We design with empathy.",
  },
  {
    name: "Sanket Modi",
    role: "Sr. Manager, Developer Relations",
    company: "CleanStart",
    photoSrc: "/images/teams/sanket-modi.webp",
    quote:
      "Working at CleanStart means solving problems that matter. We build systems where security and speed reinforce each other, not compete.",
  },
  {
    name: "Mayank Solanki",
    role: "Director - R&D",
    company: "CleanStart",
    photoSrc: "/images/testimonials/mayank-solanki.webp",
    quote:
      "CleanStart gives me the rare chance to build compliance into the foundation of how software is made. It's meaningful work with measurable impact.",
  },
];

export function TeamsInsiders(
  props: Omit<HomeTestimonialsInsidersProps, "testimonials"> = {},
) {
  return (
    <HomeTestimonialsInsiders
      {...props}
      testimonials={INSIDERS_TESTIMONIALS}
    />
  );
}
