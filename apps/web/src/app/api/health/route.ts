import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env: process.env.VERCEL_ENV ?? "development",
      ts: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
