/** CleanStart is on every event, first in the logo bar. The CMS lists only the co-hosts. */
export interface Partner {
  name: string;
  url: string;
  logoUrl: string | null;
}

export const CLEANSTART: Partner = {
  name: "CleanStart",
  url: "https://www.cleanstart.com",
  logoUrl: "/logos/cleanstart.png",
};
