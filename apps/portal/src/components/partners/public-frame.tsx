import { Icon } from "@/components/icon";

const FOOTER_LINK = { color: "#6B687D" } as const;

export function PublicBrand({ tag }: { tag: string }): React.JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span className="logo" style={{ width: 28, height: 28 }}>
        <img src="/logo-mark.svg" alt="CleanStart" style={{ width: 15, height: 17 }} />
      </span>
      <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>CleanStart</span>
      <span style={{ fontSize: 12.5, color: "#6B687D", fontWeight: 500 }}>{tag}</span>
    </div>
  );
}

export function PublicFooter({ left }: { left: React.ReactNode }): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 12,
        color: "#6B687D",
        marginTop: "auto",
      }}
    >
      <span>{left}</span>
      <span>
        <a href="https://www.cleanstart.com/privacy-policy" target="_blank" rel="noreferrer noopener" style={FOOTER_LINK}>
          Privacy
        </a>{" "}
        <span aria-hidden="true">&#183;</span>{" "}
        <a href="https://www.cleanstart.com/contact-us" target="_blank" rel="noreferrer noopener" style={FOOTER_LINK}>
          Help
        </a>
      </span>
    </div>
  );
}

interface PublicSplitProps {
  label: string;
  /** flex-basis of the form side. */
  basis?: number;
  tag: string;
  footerLeft: React.ReactNode;
  /** Extra content on the brand row, right of the tag (a sign-in link, for instance). */
  brandExtra?: React.ReactNode;
  asideLabel: string;
  aside: React.ReactNode;
  asideBasis?: number;
  children: React.ReactNode;
}

/** The two-column chrome every public page shares: form on the left, dark panel on the right. */
export function PublicSplit({
  label,
  basis = 520,
  tag,
  footerLeft,
  brandExtra,
  asideLabel,
  aside,
  asideBasis = 520,
  children,
}: PublicSplitProps): React.JSX.Element {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexWrap: "wrap", background: "#FFFFFF" }}>
      <section
        aria-label={label}
        style={{
          flex: `1 1 ${basis}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 24,
          padding: "28px 40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <PublicBrand tag={tag} />
          {brandExtra ? <span style={{ marginLeft: "auto" }}>{brandExtra}</span> : null}
        </div>
        {children}
        <PublicFooter left={footerLeft} />
      </section>
      <section
        aria-label={asideLabel}
        style={{
          position: "relative",
          overflow: "hidden",
          flex: `1 1 ${asideBasis}px`,
          minHeight: 600,
          background:
            "radial-gradient(70% 55% at 75% 30%, rgba(91,47,226,0.35) 0%, rgba(18,14,32,0) 70%), #120E20",
          color: "#FFFFFF",
          padding: "40px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {aside}
      </section>
    </div>
  );
}

export function BulletList({ items }: { items: readonly string[] }): React.JSX.Element {
  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontSize: 13,
        color: "#C9C4DE",
      }}
    >
      {items.map((text) => (
        <li key={text} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: "#9B84FF", flex: "none" }} />
          {text}
        </li>
      ))}
    </ul>
  );
}

export function NumberedSteps({
  items,
  current,
  doneThrough = 0,
}: {
  items: readonly { title: string; text: string }[];
  current?: number;
  doneThrough?: number;
}): React.JSX.Element {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((step, i) => {
        const highlight = current === i;
        const done = i < doneThrough;
        return (
          <li
            key={step.title}
            style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1fr)", gap: 10, alignItems: "start" }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 99,
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 700,
                background: highlight ? "#FFFFFF" : done ? "#9B84FF" : "rgba(255,255,255,0.08)",
                color: highlight || done ? "#120E20" : "#C9C4DE",
                boxShadow: highlight || done ? undefined : "inset 0 0 0 1px rgba(255,255,255,0.16)",
              }}
            >
              {i + 1}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{step.title}</span>
              <span style={{ fontSize: 12.5, color: "#C9C4DE" }}>{step.text}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Heading block used at the top of every public form card. */
export function PublicHeading({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h1>
      <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.55, color: "#5E5B6E" }}>{children}</p>
    </div>
  );
}

export function StatusIcon({ d, tone }: { d: string; tone?: "green" | "violet" }): React.JSX.Element {
  return (
    <span className={`li-ic${tone ? ` tone-${tone}` : ""}`} style={{ width: 36, height: 36, borderRadius: 9 }}>
      <Icon d={d} />
    </span>
  );
}

export const CHECK_D =
  "M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z";
