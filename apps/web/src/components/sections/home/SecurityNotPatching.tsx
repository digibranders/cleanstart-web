import { Reveal } from "@/components/ui/Reveal";
import { ScaleToFit } from "@/components/ui/ScaleToFit";
import { SecurityDiagram } from "./security/SecurityDiagram";

// Natural desktop width of the diagram; ScaleToFit renders at this width and
// scales the whole block down to fit narrower viewports (never stacks/wraps).
const DIAGRAM_DESIGN_WIDTH = 1240;

export function SecurityNotPatching() {
  return (
    <section
      className="relative overflow-hidden pt-section-sm pb-section-lg"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 22%, #131E8F 52%, #471EC0 82%, #4A1FCB 100%)",
      }}
    >
      {/* Faint tech grid overlay. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <Reveal header>
          <div className="mx-auto flex max-w-[820px] flex-col items-center gap-5 text-center">
            <h2
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-h2)",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              Security Isn&rsquo;t Just{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(117deg, #9a51ff 0%, #2cc1eb 100%)",
                }}
              >
                Patching
              </span>
            </h2>
            <p
              className="max-w-[680px] text-white/80"
              style={{ fontSize: "var(--fs-lead)", lineHeight: 1.4, letterSpacing: "-0.02em" }}
            >
              Risk enters your software long before deployment. CleanStart
              continuously verifies trust across the software lifecycle.
            </p>
          </div>
        </Reveal>

        <ScaleToFit designWidth={DIAGRAM_DESIGN_WIDTH}>
          <SecurityDiagram />
        </ScaleToFit>
      </div>
    </section>
  );
}
