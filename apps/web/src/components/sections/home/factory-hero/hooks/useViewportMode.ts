import { useEffect, useState } from 'react';

export type ViewportMode = 'desktop' | 'mid' | 'mobile';

function modeFor(width: number): ViewportMode {
  if (width >= 1280) return 'desktop';
  if (width >= 768) return 'mid';
  return 'mobile';
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return modeFor(window.innerWidth);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (): void => setMode(modeFor(window.innerWidth));
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return mode;
}
