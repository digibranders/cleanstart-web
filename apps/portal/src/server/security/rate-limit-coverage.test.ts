import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every server action that runs without a session (runPublicAction) must call rateLimit() before it does work, and
 * must not skip it when the client address is unknown (the callee keys it on `ctx.ip ?? UNKNOWN_IP_BUCKET`). A new public action that forgets either fails here. Password reset is not a server action:
 * Better Auth serves it with its own per address and per email limits (src/server/auth/auth.ts).
 */
const ACTIONS_DIR = join(process.cwd(), 'src/server/actions');

const publicActions = (): Array<{ file: string; name: string; body: string }> =>
  readdirSync(ACTIONS_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .flatMap((file) =>
      readFileSync(join(ACTIONS_DIR, file), 'utf8')
        .split(/^export async function /m)
        .slice(1)
        .map((chunk) => ({ file, name: /^(\w+)/.exec(chunk)?.[1] ?? '', body: chunk }))
        .filter((fn) => fn.body.includes('runPublicAction(')),
    );

describe('public server actions are rate limited', () => {
  const actions = publicActions();

  it('finds the public actions the contracts name', () => {
    expect(actions.map((a) => a.name).sort()).toEqual(
      ['acceptInviteAction', 'previewInviteAction', 'requestAccessAction', 'submitApplicationAction'].sort(),
    );
  });

  it.each(actions.map((a) => [a.name, a] as const))('%s calls rateLimit() and never skips it for an unknown address', (_name, action) => {
    // loadInvitePreview is the shared helper that rate limits the invite preview (src/server/invite-preview.ts).
    expect(action.body, `${action.file}: ${action.name} must call rateLimit(...)`).toMatch(/rateLimit\(|loadInvitePreview\(/);
    expect(action.body, `${action.file}: ${action.name} must not skip the limit when ctx.ip is null`).not.toMatch(/if \(ctx\.ip\)/);
  });
});
