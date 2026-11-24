/**
 * One entry per event. The page at /<slug> is generated from it.
 * Registrations go to the CMS lead API under `formSlug`, so a matching row
 * must exist in the CMS `forms` collection (see README.md in this folder).
 */

export interface EventPartner {
  name: string;
  href: string;
  /** Path under /public. Without it the name is set as a text wordmark. */
  logo?: string;
  /** Rendered width in px at the 32px logo height; keeps logos optically equal. */
  logoWidth?: number;
}

export interface EventDefinition {
  slug: string;
  title: string;
  /** Slug of the CMS `forms` row that receives registrations. */
  formSlug: string;
  /** Logo bar order, left to right. CleanStart always leads. */
  partners: readonly EventPartner[];
  description: string;
}

const CLEANSTART: EventPartner = {
  name: "CleanStart",
  href: "https://www.cleanstart.com",
  logo: "/logos/cleanstart.png",
  logoWidth: 153,
};

export const EVENTS: readonly EventDefinition[] = [
  {
    slug: "new-year-networking-event",
    title: "New Year Networking Event",
    formSlug: "new-year-networking",
    partners: [
      CLEANSTART,
      { name: "Upwind", href: "https://www.upwind.io", logo: "/logos/upwind.svg", logoWidth: 107 },
      { name: "Cosmos One", href: "https://www.cosmos.one", logo: "/logos/cosmos-one.svg", logoWidth: 179 },
    ],
    description:
      "Register for the New Year Networking Event hosted by CleanStart, Upwind and Cosmos One.",
  },
];

export const getEvent = (slug: string): EventDefinition | undefined =>
  EVENTS.find((event) => event.slug === slug);
