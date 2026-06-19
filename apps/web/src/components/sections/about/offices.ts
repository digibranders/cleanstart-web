import type { Office } from "./GlobalPresenceMap";

/**
 * Canonical office list — single source of truth for the global-presence map
 * and location ribbons on both the About and Contact pages. Keep edits here so
 * the two pages never drift apart.
 */
export const OFFICES: Office[] = [
  {
    id: "hq",
    city: "Lewes, Delaware",
    country: "United States",
    role: "North America (HQ)",
    address:
      "CleanStart Security Inc. 16192 Coastal Highway, Lewes, Delaware 19958, County Of Sussex",
    color: "amber",
    coordinates: [-75.5, 38.9],
    imageSrc: "/images/about/global/landmark-delaware.webp",
  },
  {
    id: "singapore",
    city: "Singapore",
    country: "Singapore",
    role: "Singapore",
    address: "1003 Bukit Merah Central, #07-23, Singapore 159836",
    color: "cyan",
    coordinates: [103.8, 1.4],
    imageSrc: "/images/about/global/landmark-singapore.webp",
  },
  {
    id: "bengaluru",
    city: "Bengaluru",
    country: "India",
    role: "India (Bengaluru)",
    address:
      "Bhive Platinum Address Maker, 114/5, Old Madras Road, Halasuru, Bengaluru, Karnataka, India – 560008",
    color: "cyan",
    coordinates: [77.6, 13.0],
    imageSrc: "/images/about/global/landmark-bengaluru.webp",
  },
  {
    id: "ahmedabad",
    city: "Ahmedabad",
    country: "India",
    role: "India (Ahmedabad)",
    address:
      "Block C, 9th floor Navratna Business Park, NR Sindhu Bhavan Rd, opp. Gtpl House, Bodakdev, Ahmedabad, Gujarat 380059",
    color: "cyan",
    coordinates: [72.6, 23.0],
    imageSrc: "/images/about/global/landmark-ahmedabad.webp",
  },
];
