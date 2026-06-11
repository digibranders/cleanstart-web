"use client";

import type React from "react";
import {
  Testimonials,
  HOME_TESTIMONIALS,
} from "@/components/sections/home/Testimonials";

/*
 * "Customer Validation" — reuses the home testimonial carousel with a single
 * card: the CISO voice (Shanker Ramrakhiani, IIFL Finance). With one item the
 * carousel renders as a static card (controls + auto-advance are suppressed).
 */
const CISO_TESTIMONIALS = HOME_TESTIMONIALS.filter((t) =>
  t.role.includes("CISO"),
);

export function CisoTestimonial(): React.ReactElement {
  return (
    <Testimonials
      testimonials={CISO_TESTIMONIALS}
      theme="light"
      centerHeader
      heading={
        <>
          Customer{" "}
          <span className="cs-text-gradient-impact">Validation</span>
        </>
      }
    />
  );
}
