'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

type Props = {
  url: string;
  /** Target rendered width in CSS pixels. Height is derived from the page aspect. */
  width?: number;
  /** Used as the `alt`-equivalent label for screen readers. */
  filename?: string | undefined;
};

/**
 * Renders page 1 of a PDF onto a canvas via pdfjs-dist. Used by the
 * MediaField thumbnail when the uploaded document is a PDF — without it,
 * the `<img src={pdfUrl}>` fallback renders as a broken-image icon.
 */
export const PdfThumb = ({ url, width = 160, filename }: Props): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;
    let pdfDoc: { destroy: () => Promise<void> } | null = null;

    const render = async (): Promise<void> => {
      try {
        // Dynamic import — keeps pdfjs-dist out of the initial admin bundle.
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.mjs',
          import.meta.url,
        ).toString();

        const loadingTask = pdfjs.getDocument({ url });
        const doc = await loadingTask.promise;
        if (cancelled) {
          await doc.destroy();
          return;
        }
        pdfDoc = doc;

        const page = await doc.getPage(1);
        if (cancelled) return;

        const dpr = window.devicePixelRatio || 1;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = (width * dpr) / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setStatus('error');
          return;
        }
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${(width * baseViewport.height) / baseViewport.width}px`;

        const task = page.render({ canvasContext: ctx, canvas, viewport });
        renderTask = task;
        await task.promise;
        if (!cancelled) setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          // Rendering can fail for password-protected, corrupted, or
          // cross-origin PDFs — fall back to the generic file label.
          // eslint-disable-next-line no-console
          console.warn('PdfThumb render failed', err);
          setStatus('error');
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      void pdfDoc?.destroy();
    };
  }, [url, width]);

  return (
    <span
      className="cs-media-field__pdf-thumb"
      data-status={status}
      role="img"
      aria-label={filename ? `PDF preview of ${filename}` : 'PDF preview'}
    >
      <canvas ref={canvasRef} />
      {status === 'error' && (
        <span className="cs-media-field__thumb-fallback">PDF</span>
      )}
    </span>
  );
};
