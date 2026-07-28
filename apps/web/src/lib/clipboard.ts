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

/** Schemes an email signature legitimately links to. */
const SAFE_URL_SCHEME = /^(?:https?:|mailto:|tel:)/i;

/** Elements that can execute or fetch, none of which belong in a signature. */
const UNSAFE_ELEMENTS = "script,iframe,object,embed,link,meta,base,form,style";

/**
 * Strips anything executable from signature markup.
 *
 * The signature HTML is authored by an admin in the CMS and is rendered on its
 * own route under a `default-src 'none'` CSP — but the copy path lifts that
 * markup *out* of that document and into this one, where the site CSP still
 * allows `script-src 'unsafe-inline'`. So `<img src=x onerror=…>` would run
 * with full DOM access on www. Parsing happens in a `DOMParser` document,
 * which has no browsing context: nothing executes and no resource loads while
 * we clean it.
 *
 * Inline `style` attributes are deliberately preserved — they are the entire
 * signature layout. Only `<style>` *elements* are dropped.
 */
export function sanitizeSignatureHtml(html: string): string {
  if (typeof DOMParser === "undefined") return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  for (const node of doc.querySelectorAll(UNSAFE_ELEMENTS)) node.remove();

  for (const el of doc.querySelectorAll("*")) {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (
        (name === "href" || name === "src" || name === "srcset") &&
        !SAFE_URL_SCHEME.test(attr.value.trim())
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }

  return doc.body.innerHTML;
}

/**
 * Copy rich HTML to the clipboard, preserving formatting on paste.
 *
 * Distinct from `copyText`: an email signature pasted as plain text loses its
 * layout, logo and links entirely, so the clipboard must carry a `text/html`
 * flavour. `plainText` is written alongside as the fallback flavour for targets
 * that only accept plain text.
 *
 * Falls back to selecting a hidden `contenteditable` node and running
 * `execCommand('copy')`, which also yields a rich-text clipboard and works
 * where the async Clipboard API is unavailable or blocked.
 *
 * Returns `true` only if the content was actually copied.
 */
export async function copyRichHtml(
  rawHtml: string,
  plainText: string,
): Promise<boolean> {
  // Sanitised once, up front, so both the ClipboardItem path and the
  // `innerHTML` fallback below are safe — and so nothing executable can be
  // pasted into the user's mail client either.
  const html = sanitizeSignatureHtml(rawHtml);
  if (html.length === 0) return false;

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof window !== "undefined" &&
    typeof window.ClipboardItem === "function"
  ) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      return true;
    } catch {
      // Fall through to the execCommand path below.
    }
  }

  if (typeof document === "undefined") return false;

  const holder = document.createElement("div");
  holder.setAttribute("contenteditable", "true");
  holder.innerHTML = html;
  holder.style.position = "fixed";
  holder.style.top = "-9999px";
  holder.style.opacity = "0";
  document.body.appendChild(holder);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(holder);
  selection?.removeAllRanges();
  selection?.addRange(range);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    selection?.removeAllRanges();
    document.body.removeChild(holder);
  }
  return ok;
}
