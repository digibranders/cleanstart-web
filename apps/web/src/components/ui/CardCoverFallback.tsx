import Image from "next/image";

/**
 * Branded placeholder for listing-card cover images when a document has no
 * hero image (e.g. guides imported from Webflow without a cover). Renders
 * the CleanStart wordmark centered on the brand gradient so a missing cover
 * reads as intentional rather than broken. Shared by GuideCard / BlogCard /
 * CaseStudyCard — swap here once real covers are in the CMS.
 */
export function CardCoverFallback(): React.ReactElement {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #1a1a4e 0%, #2d1b9e 50%, #471ec0 100%)",
      }}
      aria-hidden
    >
      <Image
        src="/images/cleanstart-logo.png"
        alt=""
        width={153}
        height={32}
        sizes="160px"
        className="pointer-events-none h-auto w-[44%] max-w-[150px] min-w-[88px] select-none opacity-90"
        draggable={false}
      />
    </div>
  );
}
