/**
 * Copy text to the clipboard with a legacy fallback.
 *
 * `navigator.clipboard.writeText` is unavailable in non-secure contexts
 * (plain-HTTP origins, some embedded iframes that lack the `clipboard-write`
 * permission). When it's missing or rejects, fall back to a hidden-textarea
 * `document.execCommand('copy')`, which works in more of those contexts.
 *
 * Returns `true` only if the text was actually copied.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the execCommand path below.
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}
