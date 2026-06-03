"use client";

import { useRef, useState } from "react";
import { submitLead } from "./submitLead";

/**
 * Shared submit logic for the email-only newsletter CTAs (Blogs, Blog detail,
 * Webinars, Events). Each CTA renders its own layout but shares this hook so
 * the `submitLead` call, consent snapshot, and in-flight/success/error state
 * live in one place.
 *
 * The newsletter form is exempt from Turnstile server-side (see the submit
 * endpoint), so these CTAs render no widget. Subscribing is the single opt-in
 * act; we snapshot that consent with a "marketing" category.
 */
const NEWSLETTER_CONSENT_TEXT =
  "I agree to receive the CleanStart newsletter and to the storage & processing of my email per the Privacy Policy.";

export interface NewsletterSignup {
  emailRef: React.RefObject<HTMLInputElement | null>;
  submitted: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useNewsletterSignup(): NewsletterSignup {
  const emailRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const email = emailRef.current?.value.trim();
    if (!email) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);

    const result = await submitLead({
      formSlug: "newsletter",
      fields: { email },
      consent: {
        snapshot: NEWSLETTER_CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories: ["marketing"],
      },
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
    });

    inFlightRef.current = false;
    if (result.ok) {
      setSubmitted(true);
      if (emailRef.current) emailRef.current.value = "";
      window.setTimeout(() => setSubmitted(false), 5000);
    } else {
      setError("Something went wrong. Please try again.");
    }
  };

  return { emailRef, submitted, error, handleSubmit };
}
