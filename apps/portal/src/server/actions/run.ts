// src/server/actions/run.ts
import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import type { z } from 'zod';
import { type Clock, systemClock } from '@/lib/clock';
import { log } from '@/server/log';
import { requireActionViewer } from '@/server/auth/viewer';
import type { Viewer } from '@/server/auth/types';
import { describeError, isPortalError, ValidationError } from '@/server/errors';
import { type ActionResult, fail, ok } from './result';

export interface ActionSpec<S extends z.ZodType> {
  /** Stable name for logs and Sentry, e.g. "registration.accept". */
  name: string;
  schema: S;
}

export interface ActionContext {
  viewer: Viewer;
  clock: Clock;
  /** Runs after the handler returns successfully, outside any transaction. Failures are logged, never thrown. */
  afterCommit(effect: () => Promise<void>): void;
  /** Shorthand for afterCommit(() => revalidatePath(path)). */
  revalidate(path: string): void;
}

export interface PublicActionContext {
  clock: Clock;
  /** First address in x-forwarded-for, or null. For rate limiting and Turnstile. */
  ip: string | null;
  afterCommit(effect: () => Promise<void>): void;
  revalidate(path: string): void;
}

const parseInput = <S extends z.ZodType>(schema: S, raw: unknown): z.output<S> => {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return parsed.data;
};

const collector = (): { effects: Array<() => Promise<void>>; afterCommit: (e: () => Promise<void>) => void; revalidate: (p: string) => void } => {
  const effects: Array<() => Promise<void>> = [];
  return {
    effects,
    afterCommit: (effect) => void effects.push(effect),
    revalidate: (path) => void effects.push(async () => revalidatePath(path)),
  };
};

const flush = async (name: string, effects: Array<() => Promise<void>>): Promise<void> => {
  for (const effect of effects) {
    try {
      await effect();
    } catch (error) {
      log.error({ action: name, err: error }, 'after-commit effect failed');
      Sentry.captureException(error, { tags: { action: name, phase: 'after_commit' } });
    }
  }
};

const toFailure = (name: string, error: unknown): ActionResult<never> => {
  if (!isPortalError(error)) {
    log.error({ action: name, err: error }, 'action failed unexpectedly');
    Sentry.captureException(error, { tags: { action: name } });
  }
  return fail(describeError(error));
};

/** The only way a signed-in server action runs. See the worked example in F.8. */
export async function runViewerAction<S extends z.ZodType, T>(
  spec: ActionSpec<S>,
  raw: unknown,
  handler: (ctx: ActionContext, input: z.output<S>) => Promise<T>,
): Promise<ActionResult<T>> {
  const { effects, afterCommit, revalidate } = collector();
  try {
    const input = parseInput(spec.schema, raw);
    const viewer = await requireActionViewer();
    const data = await handler({ viewer, clock: systemClock, afterCommit, revalidate }, input);
    await flush(spec.name, effects);
    return ok(data);
  } catch (error) {
    return toFailure(spec.name, error);
  }
}

/** For actions with no session: apply, accept invite, request access, forgot password. Rate limit and Turnstile run inside the handler. */
export async function runPublicAction<S extends z.ZodType, T>(
  spec: ActionSpec<S>,
  raw: unknown,
  handler: (ctx: PublicActionContext, input: z.output<S>) => Promise<T>,
): Promise<ActionResult<T>> {
  const { effects, afterCommit, revalidate } = collector();
  try {
    const input = parseInput(spec.schema, raw);
    const forwarded = (await headers()).get('x-forwarded-for');
    const ip = forwarded ? (forwarded.split(',')[0]?.trim() ?? null) : null;
    const data = await handler({ clock: systemClock, ip, afterCommit, revalidate }, input);
    await flush(spec.name, effects);
    return ok(data);
  } catch (error) {
    return toFailure(spec.name, error);
  }
}
