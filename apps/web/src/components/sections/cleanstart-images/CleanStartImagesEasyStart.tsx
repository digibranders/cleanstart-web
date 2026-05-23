import Image from "next/image";

type Feature = {
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    title: "Always secure",
    body: "CleanStart scans, hardens, and verifies images to reduce vulnerabilities.",
  },
  {
    title: "Built for developers",
    body: "CleanStart integrates smoothly into CI/CD, repos, and cloud platforms.",
  },
  {
    title: "Performance guaranteed",
    body: "Smaller, faster, and lighter than public images, so builds and deployments run seamlessly.",
  },
];

function GlowBall(): React.ReactElement {
  // Brand 3D ball asset (replaces the prior CSS-only purple sphere).
  return (
    <div
      aria-hidden
      className="relative shrink-0"
      style={{ width: "56px", height: "56px" }}
    >
      <Image
        src="/images/cleanstart-images/feature-ball.png"
        alt=""
        width={112}
        height={112}
        sizes="56px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export function CleanStartImagesEasyStart(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesEasyStart"
      className="relative overflow-hidden"
      style={{
        minHeight: "clamp(420px, 36vw, 520px)",
        background:
          "linear-gradient(180deg, #0B0820 0%, #1A1248 35%, #2E1B8C 75%, #3A20B0 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "80px 80px, 80px 80px",
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{ paddingTop: "var(--spacing-section-md)", paddingBottom: "var(--spacing-section-md)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_512px] gap-12 lg:gap-16 items-start">
          {/* Left column — title + subtitle + 3 features */}
          <div>
            <h2
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 4vw, 56px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Easy to{" "}
              <span className="cs-text-gradient-impact">start</span>
            </h2>
            <p
              className="mt-8 max-w-[596px]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(18px, 1.7vw, 24px)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              Just replace your base image with CleanStart. No code changes, no hassle.
            </p>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col"
                  style={{ maxWidth: "219px" }}
                >
                  <GlowBall />
                  <h3
                    className="mt-3 text-white"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(20px, 2vw, 28px)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "clamp(15px, 1.4vw, 20px)",
                      fontWeight: 400,
                      lineHeight: 1.4,
                      letterSpacing: "-0.02em",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — terminal */}
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-images/terminal.png"
              alt="Terminal output of trivy scan against cleanstart/python:latest showing zero unknown, low, medium, high, and critical vulnerabilities."
              width={512}
              height={386}
              className="w-full max-w-[512px] h-auto select-none"
              style={{
                borderRadius: "16px",
                boxShadow:
                  "0 0 0 1px rgba(123,92,250,0.5), 0 20px 60px -10px rgba(91,61,245,0.45)",
              }}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
