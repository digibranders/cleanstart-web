import type { ReactNode } from "react";

interface FormCardProps {
  children: ReactNode;
  maxWidth?: number;
}

/**
 * White form card with a thin blue border, used on the dark-gradient form
 * pages (Book a Demo, Deal Registration).
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
      style={{ fontSize: "var(--fs-body)", lineHeight: 1.3 }}
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

/**
 * Single-line text input: #FBFBFB background, 1.5px #DDDDDD border, rounded-8,
 * 48px tall, Manrope Medium 16px, placeholder #A3A3A3, focus border #3960F9.
 */
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
        className="w-full rounded-[8px] outline-none transition-colors placeholder:text-[#A3A3A3] focus:border-[#3960F9]"
        style={{
          background: "#FBFBFB",
          border: "1.5px solid #DDDDDD",
          padding: "15px 17px",
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "var(--fs-input)",
          lineHeight: 1.125,
          color: "#111111",
          height: "48px",
        }}
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

/**
 * Multi-line variant of TextInput. Same surface treatment but variable
 * height — `minHeight: 108px`, vertical resize allowed.
 */
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
        className="w-full resize-y rounded-[8px] outline-none transition-colors placeholder:text-[#A3A3A3] focus:border-[#3960F9]"
        style={{
          background: "#FBFBFB",
          border: "1.5px solid #DDDDDD",
          padding: "12px 17px",
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "var(--fs-input)",
          lineHeight: 1.5,
          color: "#111111",
          minHeight: "108px",
        }}
      />
    </label>
  );
}

/**
 * Primary submit button: #3960F9 fill, 44px tall, rounded-8, Manrope Medium
 * 18px white label, a box-shadow (1px ring + soft inner top-highlight), and a
 * blurred white-60% glow ellipse offset right of the label.
 */
export function SubmitButton({
  children = "Submit application",
}: {
  children?: ReactNode;
}): React.ReactElement {
  return (
    <button
      type="submit"
      className="relative w-full overflow-hidden rounded-[8px] text-white cursor-pointer transition-colors hover:bg-[#2438C2] disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        background: "#3960F9",
        height: "44px",
        boxShadow:
          "0 0 0 1px rgba(57, 96, 249, 1), 0 1px 2px -1px rgba(9, 6, 63, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.16)",
      }}
    >
      <span
        className="relative z-10 inline-flex items-center justify-center"
        style={{
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "var(--fs-lead)",
          lineHeight: "24.06px",
          letterSpacing: "-0.01em",
        }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: "30px",
          height: "30px",
          right: "calc(50% - 88px)",
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255, 255, 255, 0.6)",
          borderRadius: "9999px",
          filter: "blur(20px)",
        }}
      />
    </button>
  );
}
