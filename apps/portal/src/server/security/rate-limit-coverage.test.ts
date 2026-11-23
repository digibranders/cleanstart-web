import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every server action that runs without a session (runPublicAction) must call rateLimit() before it does work, and
 * must never branch on or drop the client address: an unknown address keys the limit on `ip ?? UNKNOWN_IP_BUCKET`.
 * The only other allowed use of the address is a plain pass-through to a callee, such as `verifyTurnstile({ ip: ctx.ip })`
 * or `loadInvitePreview(token, ctx.ip, clock)`. The same rule covers src/server/invite-preview.ts, which owns the
 * invite preview limit. A new public action that forgets either fails here. Password reset is not a server action:
 * Better Auth serves it with its own per address and per email limits (src/server/auth/auth.ts).
 */
const ACTIONS_DIR = join(process.cwd(), 'src/server/actions');
const INVITE_PREVIEW = join(process.cwd(), 'src/server/invite-preview.ts');

/** shortcut: line and block comment stripping by regex (a `//` inside a string literal is cut too), and a `:ip:` or `-ip` inside a string or path is skipped, fine for these files. */
const stripComments = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');

/** Why each use of `address` (an identifier pattern, as a regex source) in `source` is not `address ?? UNKNOWN_IP_BUCKET` or a pass-through. */
function addressMisuses(source: string, address: string): string[] {
  const code = stripComments(source);
  const uses = new RegExp(`(?<![\\w.$:-])${address}(?![\\w$:-])(?!\\s*:\\s*string\\b)`, 'g');
  const problems: string[] = [];
  for (const match of code.matchAll(uses)) {
    const before = code.slice(0, match.index);
    const after = code.slice(match.index + match[0].length);
    const fallback = /^\s*\?\?\s*UNKNOWN_IP_BUCKET\b/.test(after);
    const objectProperty = /\bip\s*:\s*$/.test(before) && /^\s*[,}]/.test(after);
    const callArgument = /\b(?!if\b|while\b|for\b|switch\b)[A-Za-z_$][\w$]*\s*\((?:[^()]*,\s*)?$/.test(before) && /^\s*[,)]/.test(after);
    if (!fallback && !objectProperty && !callArgument) {
      const line = code.slice(0, match.index).split('\n').length;
      problems.push(`${address} on line ${line} must be \`${address} ?? UNKNOWN_IP_BUCKET\` or a plain argument to a callee: ${code.split('\n')[line - 1]?.trim()}`);
    }
  }
  return problems;
}

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
      ['acceptInviteAction', 'confirmEmailChangeAction', 'previewInviteAction', 'requestAccessAction', 'submitApplicationAction'].sort(),
    );
  });

  it.each(actions.map((a) => [a.name, a] as const))('%s calls rateLimit() and never skips it for an unknown address', (_name, action) => {
    const code = stripComments(action.body);
    // loadInvitePreview is the shared helper that rate limits the invite preview (src/server/invite-preview.ts).
    expect(code, `${action.file}: ${action.name} must call rateLimit(...)`).toMatch(/rateLimit\(|loadInvitePreview\(/);
    expect(addressMisuses(action.body, 'ctx\\.ip'), `${action.file}: ${action.name}`).toEqual([]);
  });

  it('invite-preview.ts rate limits and never skips the limit for an unknown address', () => {
    const source = readFileSync(INVITE_PREVIEW, 'utf8');
    expect(stripComments(source)).toMatch(/rateLimit\(/);
    expect(addressMisuses(source, 'ip')).toEqual([]);
  });
});

describe('the address rule catches the bypasses', () => {
  const caught = (source: string, address = 'ctx\\.ip'): boolean => addressMisuses(source, address).length > 0;

  it.each([
    ['a short circuit', 'ctx.ip && rateLimit(`a:${ctx.ip}`, RULE);'],
    ['a ternary', 'const key = ctx.ip ? `a:${ctx.ip}` : null;'],
    ['an early return', 'if (!ctx.ip) return;'],
    ['an if', 'if (ctx.ip) rateLimit(`a:${ctx.ip ?? UNKNOWN_IP_BUCKET}`, RULE);'],
    ['a bare template use', 'rateLimit(`a:${ctx.ip}`, RULE);'],
    ['a fallback to something else', 'rateLimit(`a:${ctx.ip ?? "x"}`, RULE);'],
  ])('flags %s', (_name, source) => {
    expect(caught(source)).toBe(true);
  });

  it.each([
    ['a bare if', 'if (ip) rateLimit(`a:${ip ?? UNKNOWN_IP_BUCKET}`, RULE);'],
    ['a bare negated if', 'if (!ip) return;'],
    ['a bare short circuit', 'ip && rateLimit(`a:${ip}`, RULE);'],
  ])('flags %s on the bare parameter', (_name, source) => {
    expect(caught(source, 'ip')).toBe(true);
  });

  it.each([
    ['the fallback', 'rateLimit(`a:${ctx.ip ?? UNKNOWN_IP_BUCKET}`, RULE);'],
    ['an object pass-through', 'await verifyTurnstile({ token: input.token, ip: ctx.ip });'],
    ['a call pass-through', 'loadInvitePreview(input.token, ctx.ip, ctx.clock);'],
    ['a comment that mentions the old pattern', '// if (ctx.ip) { rateLimit(...) } is not allowed\nrateLimit(`a:${ctx.ip ?? UNKNOWN_IP_BUCKET}`, RULE);'],
  ])('accepts %s', (_name, source) => {
    expect(caught(source)).toBe(false);
  });

  it('does not count rateLimit( inside a comment', () => {
    expect(stripComments('// rateLimit(key, rule)\n/* rateLimit(x) */\nconst a = 1;')).not.toMatch(/rateLimit\(/);
  });
});
