import type { MetadataRoute } from "next";

/** Lets the portal be added to a phone's home screen and open full screen, without the browser's address bar, like an installed app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CleanStart Partner Portal",
    short_name: "CleanStart",
    description: "Register deals, find material and message CleanStart.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#120E20",
    theme_color: "#FFFFFF",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
