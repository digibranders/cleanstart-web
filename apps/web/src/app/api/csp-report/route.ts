import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface LegacyCspReport {
  "csp-report"?: {
    "document-uri"?: string;
    "violated-directive"?: string;
    "blocked-uri"?: string;
    "source-file"?: string;
    "line-number"?: number;
  };
}

interface ReportingApiBody {
  type?: string;
  body?: {
    documentURL?: string;
    effectiveDirective?: string;
    blockedURL?: string;
    sourceFile?: string;
    lineNumber?: number;
  };
}

type CspReportPayload = LegacyCspReport | ReportingApiBody | ReportingApiBody[];

function normalize(payload: CspReportPayload) {
  if (Array.isArray(payload)) {
    return payload.map((entry) => entry.body).filter(Boolean);
  }
  if ("csp-report" in payload && payload["csp-report"]) {
    const r = payload["csp-report"];
    return [
      {
        documentURL: r["document-uri"],
        effectiveDirective: r["violated-directive"],
        blockedURL: r["blocked-uri"],
        sourceFile: r["source-file"],
        lineNumber: r["line-number"],
      },
    ];
  }
  if ("body" in payload && payload.body) return [payload.body];
  return [];
}

export async function POST(request: Request) {
  let payload: CspReportPayload;
  try {
    payload = (await request.json()) as CspReportPayload;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const reports = normalize(payload);
  if (reports.length > 0) {
    // Forward to Sentry once @sentry/nextjs is installed (W5). For now, log
    // through Vercel runtime logs so violations are visible during CSP burn-in.
    console.warn("[csp-report]", JSON.stringify(reports));
  }

  return new NextResponse(null, { status: 204 });
}
