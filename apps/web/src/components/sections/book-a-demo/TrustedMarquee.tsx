import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * Trusted-by marquee strip above the footer on the Book a Demo page.
 * Reuses the same `.cs-marquee` engine as `home/TrustedByMarquee` and
 * `community/CommunityTrustedBy` — doubled logo list, mask-image edge
 * fade, seamless infinite loop. Logos sit on the white body, so no
 * brightness/inversion filter is applied; a light grayscale is used to
 * keep the visual rhythm consistent.
 */
function getTrustedLogos(): string[] {
  const dir = path.join(process.cwd(), "public", "images", "trusted");
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(svg|png|jpe?g|webp)$/i.test(f))
      .sort();
  } catch {
    return [];
  }
}

export function TrustedMarquee(): React.ReactElement {
  const logos = getTrustedLogos();
  if (logos.length === 0) return <></>;
  const doubled = [...logos, ...logos];

  return (
    <section className="relative w-full bg-white" aria-label="Trusted by leading brands">
      <div
        className="relative"
        style={{
          paddingTop: "clamp(40px, 5vw, 72px)",
          paddingBottom: "clamp(40px, 5vw, 72px)",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
          <div
            className="cs-marquee items-center"
            style={{
              gap: "clamp(48px, 5.2vw, 100px)",
              animationDuration: "40s",
            }}
          >
            {doubled.map((file, i) => (
              <div
                key={`${file}-${i}`}
                className="flex h-10 w-[160px] shrink-0 items-center justify-center"
                title={file.replace(/^\d+-/, "").replace(/\.[^.]+$/, "")}
              >
                <Image
                  src={`/images/trusted/${file}`}
                  alt=""
                  width={160}
                  height={40}
                  sizes="160px"
                  className="h-8 w-auto max-w-[160px] object-contain opacity-70 [filter:grayscale(1)]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
