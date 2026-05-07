'use client';

import type { ReactElement } from 'react';
import { useEffect } from 'react';

const ENHANCED_FLAG = 'data-cs-media-enhanced';
const URL_ROW_CLASS = 'cs-media-edit__url-row';
const REPLACE_INPUT_ID = 'cs-media-edit-replace-input';

const COPY_ICON = `
<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
  <path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
    d="M4 10H3.5A1.5 1.5 0 0 1 2 8.5V3.5A1.5 1.5 0 0 1 3.5 2h5A1.5 1.5 0 0 1 10 3.5V4M7.5 6h5A1.5 1.5 0 0 1 14 7.5v5A1.5 1.5 0 0 1 12.5 14h-5A1.5 1.5 0 0 1 6 12.5v-5A1.5 1.5 0 0 1 7.5 6Z"/>
</svg>`;

const NEW_TAB_ICON = `
<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
  <path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
    d="M9 3h4v4M13 3l-6 6M11 9.5v3.5H3V5h3.5"/>
</svg>`;

/**
 * Enhances the standalone Media collection edit page (and the
 * doc-drawer rendering of the same) with the visual + functional
 * affordances the blog editor's MediaField already has:
 *
 *   1. A monospace URL row with inline Copy + Open-in-new-tab icons
 *      (Payload's native chrome only shows the URL as a plain
 *      filename link).
 *   2. A "Replace" button that pops a hidden file input and PATCHes
 *      the existing media doc with the new file (file-input element
 *      is mounted once, reused across re-renders).
 *
 * Idempotent — gated on `data-cs-media-enhanced` so the
 * MutationObserver doesn't double-inject.
 */
export const MediaEditEnhancer = (): ReactElement | null => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const matchEditPath = (pathname: string): { id: string } | null => {
      const m = pathname.match(/^\/admin\/collections\/media\/([^/?#]+)/);
      const id = m?.[1];
      if (!id || id === 'create' || id === 'trash') return null;
      return { id };
    };

    const replaceFile = async (file: File, mediaId: string): Promise<void> => {
      const fd = new FormData();
      fd.append('file', file);
      // Use the existing record's id; PATCH /api/media/[id] with a new file.
      try {
        const res = await fetch(`/api/media/${encodeURIComponent(mediaId)}`, {
          method: 'PATCH',
          credentials: 'include',
          body: fd,
        });
        if (!res.ok) {
          window.dispatchEvent(
            new CustomEvent('cs-cms:toast', {
              detail: { message: 'Replace failed — file may be too large or wrong type.', type: 'error' },
            }),
          );
          return;
        }
        window.dispatchEvent(
          new CustomEvent('cs-cms:toast', {
            detail: { message: 'File replaced.', type: 'success' },
          }),
        );
        // Force a fresh render so the thumbnail / size / dimensions update.
        window.location.reload();
      } catch {
        window.dispatchEvent(
          new CustomEvent('cs-cms:toast', {
            detail: { message: 'Network error during replace.', type: 'error' },
          }),
        );
      }
    };

    const ensureReplaceInput = (mediaId: string): HTMLInputElement => {
      let input = document.getElementById(REPLACE_INPUT_ID) as HTMLInputElement | null;
      if (input) return input;
      input = document.createElement('input');
      input.id = REPLACE_INPUT_ID;
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.style.display = 'none';
      input.addEventListener('change', () => {
        const file = input?.files?.[0];
        if (file) void replaceFile(file, mediaId);
        if (input) input.value = '';
      });
      document.body.appendChild(input);
      return input;
    };

    const enhance = (): void => {
      const editPath = matchEditPath(window.location.pathname);
      if (!editPath) return;

      const fileDetails = document.querySelector<HTMLElement>(
        '.collection-edit--media .file-details',
      );
      if (!fileDetails) return;
      if (fileDetails.getAttribute(ENHANCED_FLAG) === '1') return;

      const fileMeta = fileDetails.querySelector<HTMLElement>('.file-meta');
      const urlAnchor = fileDetails.querySelector<HTMLAnchorElement>('.file-meta__url a');
      if (!fileMeta || !urlAnchor) return;

      const url = urlAnchor.getAttribute('href') ?? '';
      if (!url) return;

      // ── URL row ─────────────────────────────────────────────────
      const urlRow = document.createElement('div');
      urlRow.className = URL_ROW_CLASS;
      const urlText = document.createElement('span');
      urlText.className = 'cs-media-edit__url-text';
      urlText.textContent = url;
      urlText.title = url;
      urlRow.appendChild(urlText);

      const mkIconButton = (label: string, html: string, onClick: () => void): HTMLButtonElement => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cs-media-edit__url-icon';
        btn.setAttribute('aria-label', label);
        btn.title = label;
        btn.innerHTML = html;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          onClick();
        });
        return btn;
      };

      let copyResetTimer: number | undefined;
      const copyBtn = mkIconButton('Copy URL', COPY_ICON, async () => {
        try {
          await navigator.clipboard.writeText(url);
          copyBtn.setAttribute('data-copied', 'true');
          if (copyResetTimer) window.clearTimeout(copyResetTimer);
          copyResetTimer = window.setTimeout(() => copyBtn.removeAttribute('data-copied'), 1400);
          window.dispatchEvent(
            new CustomEvent('cs-cms:toast', {
              detail: { message: 'URL copied to clipboard', type: 'success' },
            }),
          );
        } catch {
          // ignore — best-effort.
        }
      });
      urlRow.appendChild(copyBtn);

      const openBtn = mkIconButton('Open in new tab', NEW_TAB_ICON, () => {
        window.open(url, '_blank', 'noopener,noreferrer');
      });
      urlRow.appendChild(openBtn);

      fileMeta.appendChild(urlRow);

      // ── Replace button ─────────────────────────────────────────
      // Insert next to the existing Preview Sizes / Edit Image buttons.
      const previewSizesBtn = fileDetails.querySelector<HTMLButtonElement>(
        '.file-field__previewSizes',
      );
      if (previewSizesBtn?.parentElement) {
        const replaceBtn = document.createElement('button');
        replaceBtn.type = 'button';
        replaceBtn.className = 'btn cs-media-edit__replace';
        replaceBtn.textContent = 'Replace';
        replaceBtn.addEventListener('click', () => {
          const input = ensureReplaceInput(editPath.id);
          input.click();
        });
        previewSizesBtn.parentElement.insertBefore(replaceBtn, previewSizesBtn);
      }

      fileDetails.setAttribute(ENHANCED_FLAG, '1');
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
};

export default MediaEditEnhancer;
