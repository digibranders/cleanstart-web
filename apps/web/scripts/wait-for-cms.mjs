import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_INTERVAL_MS = 5_000;
const REQUEST_TIMEOUT_MS = 10_000;

// The stamp keeps Cloudflare from answering a stale 200 for a CMS that is mid-restart.
export function healthUrl(cmsUrl, stamp) {
  return `${cmsUrl.replace(/\/+$/, "")}/api/health?_=${stamp}`;
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function probe(url, fetchImpl) {
  try {
    const res = await fetchImpl(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return res.status;
  } catch {
    return null;
  }
}

export async function waitForCms({
  cmsUrl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  intervalMs = DEFAULT_INTERVAL_MS,
  fetchImpl = fetch,
  sleep = defaultSleep,
  now = Date.now,
  log = console.log,
}) {
  const deadline = now() + timeoutMs;
  for (let attempt = 1; ; attempt += 1) {
    const status = await probe(healthUrl(cmsUrl, now()), fetchImpl);
    if (status === 200) {
      if (attempt > 1) log(`[wait-for-cms] CMS answered 200 on attempt ${attempt}`);
      return true;
    }
    if (now() + intervalMs > deadline) {
      log(`[wait-for-cms] CMS still not healthy after ${Math.round(timeoutMs / 1000)}s (last: ${status ?? "no response"})`);
      return false;
    }
    log(`[wait-for-cms] attempt ${attempt}: ${status ?? "no response"}, retrying in ${intervalMs / 1000}s`);
    await sleep(intervalMs);
  }
}

// A web build prerenders pages from the live CMS, and a CMS deploy restarts it for a minute or two,
// so a build that overlaps fails with 502s. This only waits; on timeout the build runs and fails as before.
async function main() {
  if (!process.env.VERCEL && !process.env.CI) return;
  const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL;
  if (!cmsUrl) {
    console.log("[wait-for-cms] NEXT_PUBLIC_CMS_URL is not set, skipping");
    return;
  }
  await waitForCms({ cmsUrl });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
