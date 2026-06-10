import { headers } from "next/headers";

import { isIndexingAllowed } from "@/lib/seo/indexing";
import { buildRobotsTxt } from "@/lib/seo/robots";

export async function GET(): Promise<Response> {
  const headerList = await headers();
  const host = headerList.get("host");

  return new Response(buildRobotsTxt({ indexable: isIndexingAllowed(host) }), {
    headers: { "Content-Type": "text/plain" },
  });
}
