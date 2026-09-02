import { HERO_DIAGRAM, VENDOR } from "./compare-data";
import { BRAND } from "./compare-visuals";

/**
 * The hero artwork: two image stacks drawn side by side.
 *
 * The whole comparison turns on one asymmetry — Docker Hardened Images stand on
 * a base inherited from an upstream distribution, CleanStart stands on nothing —
 * so the diagram draws exactly that and nothing else. The Docker column has a
 * parent block feeding into it; the CleanStart column has an empty frame where
 * that parent would be. Every label is a phrase the capability matrix below
 * also makes, so the picture never gets ahead of the table.
 *
 * Pure CSS on brand colours: no new asset, nothing to keep in sync with Figma,
 * and it re-flows instead of scaling a fixed-size raster down to mud.
 */

const SLAB_H = "clamp(38px, 3.1vw, 46px)";

function Slab({
  label,
  tone,
  index,
}: {
  label: string;
  tone: "docker" | "cleanstart";
  /** Depth in the stack, used to brighten the CleanStart slabs as they rise. */
  index: number;
}): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  return (
    <div
      className="flex items-center rounded-[10px] px-3.5"
      style={{
        height: SLAB_H,
        background: isCleanStart
          ? `rgba(106, 61, 240, ${0.3 + index * 0.09})`
          : "rgba(255, 255, 255, 0.055)",
        border: `1px solid ${
          isCleanStart ? "rgba(169, 116, 255, 0.42)" : "rgba(255, 255, 255, 0.13)"
        }`,
        boxShadow: isCleanStart
          ? "inset 0 1px 0 rgba(255,255,255,0.14)"
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <span
        aria-hidden
        className="mr-3 h-4 w-[3px] shrink-0 rounded-full"
        style={{
          background: isCleanStart
            ? `linear-gradient(180deg, ${BRAND.violetPale}, ${BRAND.blue})`
            : "rgba(255,255,255,0.32)",
        }}
      />
      <span
        className="truncate font-display"
        style={{
          fontSize: "clamp(12px, 0.95vw, 13.5px)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: isCleanStart ? "#ffffff" : "rgba(255,255,255,0.78)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Column({
  vendor,
  inherited,
  link,
  layers,
  tone,
}: {
  vendor: string;
  inherited: { label: string; detail: string };
  link: string;
  layers: readonly string[];
  tone: "docker" | "cleanstart";
}): React.ReactElement {
  const isCleanStart = tone === "cleanstart";
  return (
    <div className="flex min-w-0 flex-col">
      <p
        className="font-display"
        style={{
          fontSize: "clamp(11px, 0.85vw, 12px)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: isCleanStart ? BRAND.violetPale : "rgba(255,255,255,0.5)",
        }}
      >
        {vendor}
      </p>

      {/* The parent block. Solid on the Docker side, an empty frame on ours. */}
      <div
        className="mt-3 flex flex-col justify-center rounded-[10px] px-3.5"
        style={{
          height: SLAB_H,
          border: `1px dashed ${
            isCleanStart ? "rgba(169,116,255,0.34)" : "rgba(255,255,255,0.26)"
          }`,
          background: isCleanStart ? "transparent" : "rgba(255,255,255,0.03)",
        }}
      >
        <span
          className="truncate font-display"
          style={{
            fontSize: "clamp(11px, 0.85vw, 12.5px)",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: isCleanStart
              ? "rgba(223,155,255,0.72)"
              : "rgba(255,255,255,0.62)",
          }}
        >
          {inherited.label}
        </span>
        <span
          className="truncate"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.02em",
            color: "rgba(255,255,255,0.38)",
          }}
        >
          {inherited.detail}
        </span>
      </div>

      {/* The connector. It is the diagram's whole point that these differ. */}
      <div className="flex h-9 items-center gap-2.5 pl-1">
        <span
          aria-hidden
          className="block w-px"
          style={{
            height: "100%",
            background: isCleanStart
              ? `linear-gradient(180deg, transparent, ${BRAND.violetLight})`
              : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.34))",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.03em",
            color: isCleanStart ? BRAND.violetPale : "rgba(255,255,255,0.5)",
          }}
        >
          {link}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {layers.map((layer, i) => (
          <Slab key={layer} label={layer} tone={tone} index={i} />
        ))}
      </div>
    </div>
  );
}

export function CompareFoundationStacks(): React.ReactElement {
  return (
    <figure
      className="relative m-0 overflow-hidden"
      style={{
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(155deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.02) 55%, rgba(106,61,240,0.14) 100%)",
        padding: "clamp(20px, 2vw, 30px)",
        boxShadow: "0 30px 70px -40px rgba(0,0,0,0.75)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(120% 100% at 50% 0%, #000 20%, transparent 78%)",
        }}
      />

      <div className="relative grid grid-cols-2 gap-x-[clamp(16px,1.8vw,32px)]">
        <Column
          vendor={VENDOR.docker}
          inherited={HERO_DIAGRAM.docker.inherited}
          link={HERO_DIAGRAM.docker.link}
          layers={HERO_DIAGRAM.docker.layers}
          tone="docker"
        />
        <Column
          vendor="CleanStart Verified Images"
          inherited={HERO_DIAGRAM.cleanstart.inherited}
          link={HERO_DIAGRAM.cleanstart.link}
          layers={HERO_DIAGRAM.cleanstart.layers}
          tone="cleanstart"
        />
      </div>

      <figcaption
        className="relative mt-6 border-t pt-4"
        style={{
          borderColor: "rgba(255,255,255,0.11)",
          fontFamily: "var(--font-sans)",
          fontSize: "12.5px",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {HERO_DIAGRAM.caption}
      </figcaption>
    </figure>
  );
}
