"use client";

import { useConsent } from "./ConsentProvider";

/**
 * Footer affordance to re-open the consent banner (GDPR Art. 7(3) —
 * withdrawing consent must be as easy as giving it).
 */
export function CookiePreferencesButton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { openPrompt } = useConsent();
  return (
    <button type="button" onClick={openPrompt} className={className} style={style}>
      Cookie preferences
    </button>
  );
}
