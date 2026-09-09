import { NextResponse, type NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Returns the visitor's country so the phone field can preselect their dial
 * code. Vercel injects `x-vercel-ip-country` into every Vercel Function, so
 * this needs no third-party IP lookup, no API key and no per-request cost.
 *
 * It exists as a route rather than being read during render because every page
 * carrying a form is statically rendered and ISR-cached. Reading a request
 * header in the page would opt the whole route into dynamic rendering and
 * throw away that cache for a two-letter hint the visitor can override anyway.
 *
 * Returns `{ country: null }` off Vercel (local dev) and for the requests the
 * edge cannot place. Callers must treat null as "no guess" and fall back.
 */
export function GET(request: NextRequest): NextResponse {
  const header = request.headers.get("x-vercel-ip-country");
  const country = header && /^[A-Za-z]{2}$/.test(header) ? header.toUpperCase() : null;

  return NextResponse.json(
    { country },
    {
      headers: {
        // Per-visitor, so it must never land in a shared cache. The client
        // caches the answer in sessionStorage instead.
        "Cache-Control": "no-store, private",
      },
    },
  );
}
