import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  anonymousId: z.string().min(1).max(64),
  decision: z.enum(["accept_all", "reject_all", "custom"]),
  categories: z.object({
    strictlyNecessary: z.literal(true),
    performance: z.boolean(),
    functional: z.boolean(),
    targeting: z.boolean(),
  }),
  consentVersion: z.number().int().nonnegative(),
  gpc: z.boolean(),
});

const noStore = { "cache-control": "no-store" } as const;

const hash = (value: string, secret: string): string =>
  createHmac("sha256", secret).update(value).digest("hex");

const clientIp = (req: NextRequest): string =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: noStore },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400, headers: noStore },
    );
  }

  const hmacSecret = process.env.CONSENT_LOG_HMAC_SECRET;
  const ingestSecret = process.env.CONSENT_INGEST_SECRET;
  const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

  // Audit forward is best-effort: a logging outage must never block the
  // user's consent decision from taking effect client-side.
  if (hmacSecret && ingestSecret) {
    const ip = clientIp(req);
    const ua = req.headers.get("user-agent") ?? "";
    const country = req.headers.get("x-vercel-ip-country");
    const payload = {
      ...parsed.data,
      ...(country ? { country } : {}),
      ...(ip ? { ipHash: hash(ip, hmacSecret) } : {}),
      ...(ua ? { userAgentHash: hash(ua, hmacSecret) } : {}),
    };
    try {
      await fetch(`${cmsUrl}/api/consentLog/ingest`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ingestSecret}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
    } catch {
      // Swallowed by design — see comment above. Sentry captures via the
      // global handler if configured.
    }
  }

  return new NextResponse(null, { status: 204, headers: noStore });
}
