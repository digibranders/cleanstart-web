import type React from "react";
import { Reveal } from "@/components/ui/Reveal";

type StackItem = {
  label: string;
  iconSrc: string;
  bg: string;
  iconW: number;
  iconH: number;
};

type FeatureItem = {
  title: string;
  body: string;
  iconSrc: string;
};

const YOUR_STACK: StackItem[] = [
  {
    label: "Docker",
    iconSrc: "/images/cleanstart-images/workflows-docker.png",
    bg: "rgba(36,150,237,0.2)",
    iconW: 21,
    iconH: 21,
  },
  {
    label: "GitHub Actions",
    iconSrc: "/images/cleanstart-images/workflows-github.png",
    bg: "rgba(255,255,255,0.1)",
    iconW: 21,
    iconH: 21,
  },
  {
    label: "Jenkins",
    iconSrc: "/images/cleanstart-images/workflows-jenkins.png",
    bg: "rgba(255,255,255,0.1)",
    iconW: 27,
    iconH: 22,
  },
  {
    label: "Existing Registry",
    iconSrc: "/images/cleanstart-images/workflows-registry.svg",
    bg: "rgba(255,255,255,0.1)",
    iconW: 22,
    iconH: 22,
  },
];

const YOUR_DEPLOYMENTS: StackItem[] = [
  {
    label: "Kubernetes",
    iconSrc: "/images/cleanstart-images/workflows-kubernetes.png",
    bg: "rgba(50,108,229,0.2)",
    iconW: 22,
    iconH: 22,
  },
  {
    label: "Cloud Providers",
    iconSrc: "/images/cleanstart-images/workflows-cloud.png",
    bg: "rgba(255,255,255,0.1)",
    iconW: 21,
    iconH: 21,
  },
  {
    label: "Applications",
    iconSrc: "/images/cleanstart-images/workflows-apps.svg",
    bg: "rgba(255,255,255,0.1)",
    iconW: 21,
    iconH: 21,
  },
  {
    label: "Existing CI/CD",
    iconSrc: "/images/cleanstart-images/workflows-cicd.svg",
    bg: "rgba(255,255,255,0.1)",
    iconW: 22,
    iconH: 22,
  },
];

const FEATURES: FeatureItem[] = [
  {
    title: "Registry Compatible",
    body: "Works with existing registries and pipelines.",
    iconSrc: "/images/cleanstart-images/workflows-feat-registry-compatible.svg",
  },
  {
    title: "Minimal Workflow Changes",
    body: "Drop-in replacement — just change your base image tag.",
    iconSrc: "/images/cleanstart-images/workflows-feat-minimal-workflow.svg",
  },
  {
    title: "Continuous Updates",
    body: "Always access current hardened images.",
    iconSrc: "/images/cleanstart-images/workflows-feat-continuous-updates.svg",
  },
];

const CHECKLIST = [
  "Built from trusted sources",
  "Minimal runtime images",
  "Continuous rebuilds",
];

function ConnectorBeam({
  alignPct,
}: {
  // Horizontal center of the rod, as a percent of content width.
  alignPct: number;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className="md:hidden relative"
      style={{
        width: "100%",
        height: "142px",
        pointerEvents: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-images/workflows-mobile-rod.png"
        alt=""
        aria-hidden
        width={131}
        height={142}
        style={{
          position: "absolute",
          top: 0,
          left: `${alignPct}%`,
          transform: "translateX(-50%)",
          width: "131px",
          height: "142px",
        }}
        className="block select-none pointer-events-none"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function StackPanel({
  label,
  items,
}: {
  label: string;
  items: StackItem[];
}): React.ReactElement {
  return (
    <div
      className="flex flex-col relative"
      style={{ flex: "1 1 0", minWidth: 0, zIndex: 10 }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-caption)",
          fontWeight: 700,
          color: "#9ca3af",
          letterSpacing: "1.2858px",
          textTransform: "uppercase",
          lineHeight: 1,
          marginBottom: "22.042px",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {label}
      </p>

      <div
        style={{
          backdropFilter: "blur(1.837px)",
          background: "rgba(15,10,31,0.6)",
          border: "0.918px solid rgba(139,92,246,0.3)",
          borderRadius: "11px",
          padding: "22.918px",
          display: "flex",
          flexDirection: "column",
          gap: "14.694px",
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "0.918px solid rgba(255,255,255,0.1)",
              borderRadius: "7.347px",
              padding: "11.939px",
              display: "flex",
              gap: "14.694px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: item.bg,
                borderRadius: "3.674px",
                width: "37px",
                height: "37px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.iconSrc}
                alt=""
                aria-hidden
                width={item.iconW}
                height={item.iconH}
                style={{ width: `${item.iconW}px`, height: `${item.iconH}px` }}
                className="select-none pointer-events-none"
                loading="lazy"
                decoding="async"
              />
            </div>

            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-body-sm)",
                fontWeight: 500,
                color: "#fff",
                lineHeight: "22.042px",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CleanStartImagesEasyStart(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesWorkflows"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
    >
      {/* Corner Union — top-left */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden md:block"
        style={{
          left: "-208px",
          top: "-191px",
          width: "468.866px",
          height: "488.266px",
          mixBlendMode: "overlay",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/workflows-union-left.svg"
          alt=""
          aria-hidden
          className="block size-full max-w-none select-none pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Corner Union — top-right */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden md:block"
        style={{
          right: "-214px",
          top: "-118px",
          width: "399.83px",
          height: "416.374px",
          mixBlendMode: "overlay",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/workflows-union-right.svg"
          alt=""
          aria-hidden
          className="block size-full max-w-none select-none pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "var(--spacing-section-md)",
          paddingBottom: "var(--spacing-section-md)",
        }}
      >
        <Reveal header>
          <h2
            className="text-white text-center mx-auto"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "700px",
            }}
          >
            Delivered Through Your Existing{" "}
            <span className="cs-text-gradient-impact">Workflows</span>
          </h2>
        </Reveal>

        <div
          className="mt-12 md:mt-16 mx-auto"
          style={{ maxWidth: "1058px" }}
        >
          {/*
           * Desktop: 5-column grid — [panel] [connector] [center card] [connector] [panel].
           * The center column holds only the card; the callout sits in its own
           * row below the grid, wider than the card.
           */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_66px_255px_66px_1fr] items-start">

            <StackPanel label="YOUR EXISTING STACK" items={YOUR_STACK} />

            {/* Mobile beam: stack → hardened images. z-index:0 so the card border paints over it. */}
            <div
              className="md:hidden relative"
              style={{ marginTop: "-30px", marginBottom: "-90px", zIndex: 0 }}
            >
              <ConnectorBeam alignPct={19.7} />
            </div>

            {/* Left connector beam — desktop only; rod rotated 90° to run horizontally between stack and hardened card */}
            <div
              aria-hidden
              className="hidden md:flex items-center justify-center"
              style={{ paddingTop: "180px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-images/workflows-mobile-rod.png"
                alt=""
                aria-hidden
                width={131}
                height={142}
                style={{
                  width: "100px",
                  height: "108px",
                  transform: "rotate(90deg)",
                  transformOrigin: "center center",
                }}
                className="select-none pointer-events-none"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Center card column. On mobile it is slightly narrower than the content so the rod beams have side room and the card border (z-index:10) paints over them. */}
            <div
              className="flex flex-col items-center mt-2 md:mt-0 relative w-full max-w-[288px] md:max-w-none mx-auto"
              style={{ zIndex: 10 }}
            >
              <div className="text-center" style={{ paddingBottom: "8px" }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-caption)",
                    fontWeight: 700,
                    color: "#a855f7",
                    letterSpacing: "2.2042px",
                    textTransform: "uppercase",
                    lineHeight: 1.25,
                  }}
                >
                  CLEANSTART
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-body)",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "1.6531px",
                    textTransform: "uppercase",
                    lineHeight: 1.55,
                  }}
                >
                  HARDENED IMAGES
                </p>
              </div>

              <div
                className="relative overflow-hidden w-full"
                style={{
                  border: "1.658px solid #b23eff",
                  borderRadius: "14.925px",
                  background: "#030014",
                  boxShadow: "0px 0px 36.736px rgba(139,92,246,0.4)",
                  padding: "30.678px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "36.483px",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none rounded-[inherit]"
                  style={{
                    boxShadow:
                      "inset 0px 0px 18.368px 1.837px rgba(139,92,246,0.2)",
                  }}
                />

                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    top: "-36.56px",
                    right: "-36.32px",
                    width: "117.556px",
                    height: "117.556px",
                    background: "rgba(139,92,246,0.2)",
                    filter: "blur(29.389px)",
                    borderRadius: "50%",
                  }}
                />

                <div className="flex justify-center" style={{ position: "relative", zIndex: 1 }}>
                  <div
                    className="relative flex items-center justify-center"
                    style={{ width: "117.556px", height: "117.556px" }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background: "rgba(178,62,255,0.5)",
                        filter: "blur(30.807px)",
                      }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/cleanstart-images/workflows-center-cube.png"
                      alt=""
                      aria-hidden
                      width={77}
                      height={90}
                      style={{
                        position: "relative",
                        zIndex: 1,
                        width: "77.111px",
                        height: "89.549px",
                      }}
                      className="select-none pointer-events-none"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14.694px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {CHECKLIST.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "11.021px",
                      }}
                    >
                      <div
                        style={{
                          border: "0.918px solid #8b5cf6",
                          borderRadius: "9999px",
                          width: "22.042px",
                          height: "22.042px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0.918px",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/cleanstart-images/workflows-check.svg"
                          alt=""
                          aria-hidden
                          width={13}
                          height={13}
                          style={{ width: "12.858px", height: "12.858px" }}
                          className="select-none pointer-events-none"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "var(--fs-body-sm)",
                          fontWeight: 500,
                          color: "#fff",
                          lineHeight: "22.042px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile beam: hardened images → deployments. z-index:0 so the card paints over it. Small top overlap into the hardened card bottom, large bottom overlap through the deployments label into its items card. */}
            <div
              className="md:hidden relative"
              style={{ marginTop: "-30px", marginBottom: "-90px", zIndex: 0 }}
            >
              <ConnectorBeam alignPct={81.5} />
            </div>

            {/* Right connector beam — desktop only; rod rotated 90° between hardened card and deployments */}
            <div
              aria-hidden
              className="hidden md:flex items-center justify-center"
              style={{ paddingTop: "180px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-images/workflows-mobile-rod.png"
                alt=""
                aria-hidden
                width={131}
                height={142}
                style={{
                  width: "100px",
                  height: "108px",
                  transform: "rotate(90deg)",
                  transformOrigin: "center center",
                }}
                className="select-none pointer-events-none"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Mobile top margin keeps the gap between the hardened card and the deployments items card consistent. */}
            <div className="mt-[22px] md:mt-0">
              <StackPanel label="YOUR DEPLOYMENTS" items={YOUR_DEPLOYMENTS} />
            </div>
          </div>

          {/* Callout row. The vector paths start at the grid bottom and extend downward into the callout box to create the visual connection. */}
          <div className="flex flex-col relative">
            {/* Left curve, positioned so its right edge meets the callout's left edge. Desktop only. */}
            <div
              aria-hidden
              className="absolute pointer-events-none select-none hidden md:block"
              style={{
                left: "193px",
                top: "0",
                width: "176px",
                height: "122px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-images/workflows-callout-curve-left.svg"
                alt=""
                aria-hidden
                className="block size-full max-w-none select-none pointer-events-none"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Right curve, positioned so its left edge meets the callout's right edge. Desktop only. */}
            <div
              aria-hidden
              className="absolute pointer-events-none select-none hidden md:block"
              style={{
                left: "689px",
                top: "0",
                width: "171px",
                height: "121px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-images/workflows-callout-curve-right.svg"
                alt=""
                aria-hidden
                className="block size-full max-w-none select-none pointer-events-none"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Mobile beam: deployments → callout, centered. Margins match the ~80px gap on either side of the hardened card. z-index:0 so the callout border paints over the beam's bottom tail. */}
            <div
              className="md:hidden relative"
              style={{ marginTop: "-31px", marginBottom: "-31px", zIndex: 0 }}
            >
              <ConnectorBeam alignPct={50} />
            </div>

            {/* Vertical connector beam from card bottom → callout — desktop only. Negative margins and zIndex:0 let it overlap both the hardened card above and the callout below so it visibly connects them. */}
            <div
              aria-hidden
              className="hidden md:block relative"
              style={{
                alignSelf: "center",
                lineHeight: 0,
                marginTop: "-32px",
                marginBottom: "-12px",
                zIndex: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-images/workflows-mobile-rod.png"
                alt=""
                aria-hidden
                width={131}
                height={142}
                style={{ width: "90px", height: "120px" }}
                className="block select-none pointer-events-none"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Always-up-to-date callout, width sized to content and centered. Position:relative + zIndex:10 so it paints over the rod beam tail. */}
            <div
              className="w-full max-w-[320px] mx-auto relative"
              style={{
                background: "rgba(15,10,31,0.6)",
                border: "0.918px solid rgba(139,92,246,0.3)",
                borderRadius: "11.021px",
                padding: "22.918px",
                minHeight: "97px",
                display: "flex",
                alignItems: "center",
                gap: "22px",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  background: "#030014",
                  border: "0.918px solid #8b5cf6",
                  borderRadius: "9999px",
                  width: "51.431px",
                  height: "51.431px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  filter: "drop-shadow(0px 0px 6.888px rgba(139,92,246,0.3))",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cleanstart-images/workflows-clock.svg"
                  alt=""
                  aria-hidden
                  width={29}
                  height={29}
                  style={{ width: "29.389px", height: "29.389px" }}
                  className="select-none pointer-events-none"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Text constrained to 185px so the body wraps on mobile */}
              <div style={{ maxWidth: "185px" }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-body)",
                    fontWeight: 700,
                    color: "#f3f4f6",
                    lineHeight: "25.715px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Always up-to-date.
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 400,
                    color: "#9ca3af",
                    lineHeight: "18.368px",
                  }}
                >
                  Automatically rebuilt with the latest fixes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-14 md:mt-20 relative mx-auto"
          style={{ maxWidth: "1058px" }}
        >
          {/* Mobile: centered vertical stack with separator lines */}
          <div className="sm:hidden flex flex-col items-center">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="flex flex-col items-center w-full">
                <div className="flex flex-col items-center text-center py-8">
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "120px",
                      background:
                        "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                      boxShadow:
                        "0px 4.5px 10.5px rgba(28,60,142,0.33), inset 0px -0.175px 0.218px rgba(0,44,179,0.5), inset 0px 0.087px 0.436px rgba(255,255,255,0.81)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.iconSrc}
                      alt=""
                      aria-hidden
                      width={40}
                      height={40}
                      style={{ width: "40px", height: "40px" }}
                      className="select-none pointer-events-none"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <h3
                    className="text-white font-display"
                    style={{
                      marginTop: "20px",
                      fontSize: "var(--fs-h4)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                    }}
                  >
                    {f.title}
                  </h3>

                  <p
                    className="font-sans"
                    style={{
                      marginTop: "12px",
                      fontSize: "var(--fs-body-sm)",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.8)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.5,
                      maxWidth: "220px",
                    }}
                  >
                    {f.body}
                  </p>
                </div>

                {i < FEATURES.length - 1 && (
                  <div
                    aria-hidden
                    style={{
                      width: "187px",
                      height: "1.5px",
                      flexShrink: 0,
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Desktop: 3-column grid with vertical dividers */}
          <div className="hidden sm:block">
            <div className="relative">
              <div
                aria-hidden
                className="absolute hidden md:block pointer-events-none inset-y-0"
                style={{
                  left: "33.333%",
                  width: "0.918px",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
                }}
              />
              <div
                aria-hidden
                className="absolute hidden md:block pointer-events-none inset-y-0"
                style={{
                  left: "66.666%",
                  width: "0.918px",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
                }}
              />

              <div className="grid sm:grid-cols-3">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.title}
                    className={[
                      i > 0 ? "sm:pl-6 md:pl-12" : "",
                      i < FEATURES.length - 1 ? "sm:pr-6 md:pr-12" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div
                      style={{
                        width: "73.038px",
                        height: "73.038px",
                        borderRadius: "120px",
                        background:
                          "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                        boxShadow:
                          "0px 4.629px 10.903px rgba(28,60,142,0.33), inset 0px -0.175px 0.218px rgba(0,44,179,0.5), inset 0px 0.087px 0.436px rgba(255,255,255,0.81)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "20px",
                        overflow: "hidden",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.iconSrc}
                        alt=""
                        aria-hidden
                        width={40}
                        height={40}
                        style={{ width: "40.5px", height: "40.5px" }}
                        className="select-none pointer-events-none"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <h3
                      className="text-white font-display"
                      style={{
                        fontSize: "var(--fs-h3)",
                        fontWeight: 600,
                        letterSpacing: "-0.04em",
                        lineHeight: 1.1,
                      }}
                    >
                      {f.title}
                    </h3>

                    <p
                      className="font-sans"
                      style={{
                        marginTop: "12px",
                        fontSize: "var(--fs-body)",
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.7)",
                        lineHeight: 1.4,
                      }}
                    >
                      {f.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
