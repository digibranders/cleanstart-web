export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3005").replace(
  /\/$/,
  "",
);

export const SITE_NAME = "CleanStart Events";

/** Indexable only when explicitly enabled, so preview deploys stay out of search. */
export const isIndexingAllowed = (): boolean => process.env.ALLOW_INDEXING === "1";
