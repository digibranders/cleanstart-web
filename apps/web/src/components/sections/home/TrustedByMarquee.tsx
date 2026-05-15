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

export function TrustedByMarquee() {
  const logos = getTrustedLogos();
  const doubled = [...logos, ...logos];

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-[1.1875rem] font-normal leading-[1.1] tracking-[-0.03em] text-white/85">
        Trusted by Leading Global Brands
      </p>

      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="cs-marquee items-center gap-12 py-2">
          {doubled.map((file, i) => (
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
                className="h-8 max-w-[120px] object-contain opacity-80 [filter:grayscale(1)_brightness(2)_contrast(1.1)]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
