import { z } from "zod";

/**
 * Events and their forms come from the CMS (`/api/eventPages/site`). Everything
 * crossing that boundary is parsed here, so the rest of the app works with typed
 * values and a malformed response fails loudly instead of rendering half a page.
 */

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000").replace(/\/$/u, "");

/** Pages re-fetch at most this often, so an edit in the CMS shows up within a minute. */
export const REVALIDATE_SECONDS = 60;

const formFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  label: z.string(),
  required: z.boolean(),
  placeholder: z.string().nullable(),
  helpText: z.string().nullable(),
  options: z.array(z.object({ label: z.string(), value: z.string() })),
  minLength: z.number().nullable(),
  maxLength: z.number().nullable(),
  requireBusinessEmail: z.boolean(),
  conditions: z.object({
    mode: z.enum(["all", "any"]),
    rules: z.array(z.object({ fieldName: z.string(), operator: z.string(), value: z.string() })),
  }),
});

const siteEventSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  dateLabel: z.string().nullable(),
  venue: z.string().nullable(),
  registrationOpen: z.boolean(),
  partners: z.array(z.object({ name: z.string(), url: z.string(), logoUrl: z.string().nullable() })),
  form: z.object({ slug: z.string(), submitLabel: z.string(), fields: z.array(formFieldSchema) }),
});

export type FormField = z.infer<typeof formFieldSchema>;
export type SiteEvent = z.infer<typeof siteEventSchema>;

export class CmsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsError";
  }
}

const get = async (path: string): Promise<Response> => {
  try {
    return await fetch(`${CMS_URL}${path}`, { next: { revalidate: REVALIDATE_SECONDS } });
  } catch (error) {
    throw new CmsError(`CMS unreachable at ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export async function getEvents(): Promise<SiteEvent[]> {
  const res = await get("/api/eventPages/site");
  if (!res.ok) throw new CmsError(`CMS returned ${res.status} for the event list`);
  return z.object({ events: z.array(siteEventSchema) }).parse(await res.json()).events;
}

/** `null` when the event does not exist or is not published. */
export async function getEvent(slug: string): Promise<SiteEvent | null> {
  const res = await get(`/api/eventPages/site/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new CmsError(`CMS returned ${res.status} for event ${slug}`);
  return z.object({ event: siteEventSchema }).parse(await res.json()).event;
}
