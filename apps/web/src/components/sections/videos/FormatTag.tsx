import { videoCategoryLabel, type Video } from "@/lib/videos-utils";

const TONE: Record<"explainer" | "demo" | "none", string> = {
  explainer: "bg-[#EFEAFE] text-[#4A24C9]",
  demo: "bg-[#DDF5EC] text-[#0B6B57]",
  none: "bg-[#F1EFF8] text-[#3D3A4F]",
};

/** The category pill: violet for explainers, green for product demos, grey for unfiled. */
export function FormatTag({ video }: { video: Pick<Video, "format"> }): React.ReactElement {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 font-sans text-[12px] font-semibold ${TONE[video.format ?? "none"]}`}
    >
      {videoCategoryLabel(video)}
    </span>
  );
}
