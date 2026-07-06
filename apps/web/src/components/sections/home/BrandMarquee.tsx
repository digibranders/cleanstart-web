import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

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

export function BrandMarquee() {
  const logos = getTrustedLogos();
  const doubled = [...logos, ...logos];

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-body-md font-normal leading-[1.5] text-white/85 sm:[font-size:var(--fs-lead-sm)]">
        Trusted by Leading Global Brands
      </p>

      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="cs-marquee items-center gap-12 py-2">
          {doubled.map((file, i) => {
            const isMahindra = /mahindra/i.test(file);
            return (
              <div
                key={`${file}-${i}`}
                className="flex h-10 w-[120px] shrink-0 items-center justify-center"
                title={file.replace(/\.[^.]+$/, "")}
              >
                <Image
                  src={`/images/trusted/${file}`}
                  alt=""
                  width={120}
                  height={32}
                  sizes="120px"
                  className={
                    isMahindra
                      ? "h-8 max-w-[120px] object-contain opacity-100 [filter:grayscale(1)_brightness(3.2)_contrast(1.2)]"
                      : "h-8 max-w-[120px] object-contain opacity-80 [filter:grayscale(1)_brightness(2)_contrast(1.1)]"
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
