import Link from "next/link";

/**
 * Minimal shared GDPR consent for lead-capture forms on light/white surfaces
 * (Contact, Deal Registration, Become-a-Partner). Two granular checkboxes:
 *   - optional `consent_marketing` (marketing-communications opt-in → drives
 *     HubSpot marketing-contact status)
 *   - required `consent_storage`   (storage/processing of personal data)
 * Both post with the form; the required line links to the Privacy Policy.
 * (Book a Demo keeps its own longer consent copy by design.)
 */
export function LeadConsent(): React.ReactElement {
  return (
    <div className="flex flex-col gap-2.5 text-left">
      <ConsentCheckbox
        name="consent_marketing"
        label="Keep me updated on CleanStart products & services."
      />
      <ConsentCheckbox
        name="consent_storage"
        required
        label={
          <>
            I agree to the storage &amp; processing of my data per the{" "}
            <Link
              href="/privacy-policy"
              className="underline"
              style={{ color: "#2F49E5" }}
            >
              Privacy Policy
            </Link>
            .
          </>
        }
      />
    </div>
  );
}

function ConsentCheckbox({
  name,
  label,
  required,
}: {
  name: string;
  label: React.ReactNode;
  required?: boolean;
}): React.ReactElement {
  return (
    <label className="flex items-start cursor-pointer" style={{ gap: "8px" }}>
      {/* Box sits in a one-line-tall flex box so it vertically centers
          against the first line of the (possibly wrapping) label text. */}
      <span
        className="inline-flex shrink-0 items-center"
        style={{ height: "1.4em", fontSize: "var(--fs-caption)" }}
      >
        <span className="relative inline-flex" style={{ width: "18px", height: "18px" }}>
          <input
            type="checkbox"
            name={name}
            required={required}
            aria-required={required || undefined}
            className="peer w-full h-full appearance-none cursor-pointer rounded-[4px] bg-[#FBFBFB] border-[1.5px] border-[#DDDDDD] checked:bg-[#3960F9] checked:border-[#3960F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3960F9]"
          />
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="pointer-events-none absolute inset-0 m-auto hidden peer-checked:block"
            width="12"
            height="12"
          >
            <path
              d="M3 8.5l3 3 7-7"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans), 'Sora', sans-serif",
          fontWeight: 400,
          fontSize: "var(--fs-caption)",
          lineHeight: 1.4,
          letterSpacing: "-0.02em",
          color: "#111111",
          opacity: 0.85,
        }}
      >
        {label}
        {required && <span className="ml-0.5 text-[#D14343]">*</span>}
      </span>
    </label>
  );
}
