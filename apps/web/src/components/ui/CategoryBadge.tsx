import type React from "react";

/**
 * Shared category/tag badge used across blog, news, and resource cards.
 */
export function CategoryBadge({ label }: { label: string }): React.ReactElement {
  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap"
      style={{
        padding: "4px 10px",
        borderRadius: "10px",
        background: "linear-gradient(180deg, #FFFFFF 0%, #E8E4FF 60%, #D9D2FF 100%)",
        boxShadow: "0px 3px 0px 0px #3D3DF5",
      }}
    >
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          width: "44px",
          height: "6px",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          borderRadius: "50%",
          background: "#00cfff",
          filter: "blur(7px)",
          opacity: 0.75,
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          width: "24px",
          height: "4px",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          borderRadius: "50%",
          background: "#4a3bf1",
          filter: "blur(5px)",
        }}
      />
      <span
        className="relative text-sm font-medium leading-[1.3]"
        style={{ color: "#4a3bf1" }}
      >
        {label}
      </span>
    </div>
  );
}
