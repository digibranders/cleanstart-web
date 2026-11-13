import { type Clock, fixedClock } from '@/lib/clock';
import type { ActionContext } from '@/server/actions/run';
import type { Viewer } from '@/server/auth/types';

export interface TestActionContext {
  ctx: ActionContext;
  /** Paths passed to ctx.revalidate, in order. */
  revalidated: string[];
  /** Runs and clears the effects registered with ctx.afterCommit, as runViewerAction does after the handler returns. */
  flush: () => Promise<void>;
}

export function makeActionCtx(viewer: Viewer, clock: Clock = fixedClock('2026-11-06T14:02:00Z')): TestActionContext {
  const effects: Array<() => Promise<void>> = [];
  const revalidated: string[] = [];
  return {
    ctx: {
      viewer,
      clock,
      afterCommit: (effect) => void effects.push(effect),
      revalidate: (path) => void revalidated.push(path),
    },
    revalidated,
    flush: async () => {
      for (const effect of effects.splice(0)) await effect();
    },
  };
}
