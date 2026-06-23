"use client";

import { useRef, useState } from "react";
import { submitLead } from "./submitLead";

const NEWSLETTER_CONSENT_TEXT =
  "I agree to receive the CleanStart newsletter and to the storage & processing of my email per the Privacy Policy.";

export interface NewsletterSignup {
  emailRef: React.RefObject<HTMLInputElement | null>;
  consentRef: React.RefObject<HTMLInputElement | null>;
  submitted: boolean;
  submitting: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useNewsletterSignup(): NewsletterSignup {
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const email = emailRef.current?.value.trim();
    if (!email) return;
    if (!consentRef.current?.checked) {
      setError("Please agree to the Privacy Policy to subscribe.");
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
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
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      if (emailRef.current) emailRef.current.value = "";
      if (consentRef.current) consentRef.current.checked = false;
      window.setTimeout(() => setSubmitted(false), 5000);
    } else {
      setError("Something went wrong. Please try again.");
    }
  };

  return { emailRef, consentRef, submitted, submitting, error, handleSubmit };
}
