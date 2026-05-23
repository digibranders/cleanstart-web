import type { ReactNode } from "react";

interface FormCardProps {
  children: ReactNode;
  maxWidth?: number;
}

/**
 * White form card with a thin blue border, used on the dark-gradient form
 * pages (Book a Demo, Deal Registration). Matches Figma frames 834:3486 / 834:4422.
 */
export function FormCard({ children, maxWidth = 488 }: FormCardProps): React.ReactElement {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: `${maxWidth}px` }}>
      <div
        className="rounded-[14px] bg-white p-[clamp(20px,2.5vw,32px)]"
        style={{
          border: "2px solid #2F49E5",
          boxShadow: "0 20px 60px -20px rgba(15, 18, 62, 0.45)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface FormSectionTitleProps {
  children: ReactNode;
}

export function FormSectionTitle({ children }: FormSectionTitleProps): React.ReactElement {
  return (
    <h2
      className="font-display font-semibold text-[#0F123E]"
      style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.3 }}
    >
      {children}
    </h2>
  );
}

interface TextInputProps {
  name: string;
  type?: "text" | "email" | "tel";
  placeholder: string;
  label?: string;
  required?: boolean;
}

export function TextInput({
  name,
  type = "text",
  placeholder,
  label,
  required,
}: TextInputProps): React.ReactElement {
  return (
    <label className="block">
      {label && <span className="sr-only">{label}</span>}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        aria-label={label ?? placeholder}
        className="w-full rounded-[8px] border border-[#D9DFE8] bg-white px-4 py-3 text-[#0F123E] placeholder:text-[#94A3B8] outline-none focus:border-[#2F49E5] focus:ring-2 focus:ring-[#2F49E5]/20 transition-colors"
        style={{ fontSize: "16px", lineHeight: 1.4 }}
      />
    </label>
  );
}

interface TextAreaProps {
  name: string;
  placeholder: string;
  rows?: number;
  label?: string;
}

export function TextArea({
  name,
  placeholder,
  rows = 5,
  label,
}: TextAreaProps): React.ReactElement {
  return (
    <label className="block">
      {label && <span className="sr-only">{label}</span>}
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="w-full rounded-[8px] border border-[#D9DFE8] bg-white px-4 py-3 text-[#0F123E] placeholder:text-[#94A3B8] outline-none focus:border-[#2F49E5] focus:ring-2 focus:ring-[#2F49E5]/20 transition-colors resize-y"
        style={{ fontSize: "16px", lineHeight: 1.5 }}
      />
    </label>
  );
}

export function SubmitButton({ children = "Submit application" }: { children?: ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-[8px] bg-[#2F49E5] hover:bg-[#2438C2] text-white font-semibold py-3 transition-colors"
      style={{ fontSize: "var(--btn-fs-md, 16px)", minHeight: "44px" }}
    >
      {children}
    </button>
  );
}

export function RecaptchaPlaceholder(): React.ReactElement {
  return (
    <div
      className="flex items-center justify-between rounded-[6px] bg-[#F9F9F9] border border-[#D9DFE8] px-4 py-3"
      aria-label="reCAPTCHA placeholder"
    >
      <span
        className="rounded-[4px] bg-[#2F8AF0] px-3 py-1 text-white"
        style={{ fontSize: "12px", lineHeight: 1.4 }}
      >
        protect by recaptcha
      </span>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 4a12 12 0 1 1-8.485 3.515M4 8v6h6"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
