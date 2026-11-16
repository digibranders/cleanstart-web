import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

/**
 * Next reads its env files with its own dotenv parser, which accepts forms that node:util parseEnv does not
 * (`KEY: value`, a byte order mark before the first key, `export KEY=value`, CRLF line endings). A check written
 * with another parser can miss a variable that Next then loads. So the check asks Next's own loader.
 *
 * The loader runs in a child process in development mode: it writes what it parses into process.env and keeps module
 * state, and the Playwright runner sets NODE_ENV=test, which would make it read the test files instead of the ones
 * `next dev` reads. The child gets an environment of its own (NODE_ENV only), so nothing in the test process is touched or hidden.
 */
const LOADER = `
const { loadEnvConfig } = require(process.argv[1]);
const quiet = { info() {}, error(...args) { console.error(...args); } };
const { loadedEnvFiles } = loadEnvConfig(process.argv[2], true, quiet, true);
process.stdout.write(JSON.stringify(loadedEnvFiles.map((file) => ({ path: file.path, keys: Object.keys(file.env) }))));
`;

/**
 * Returns "KEY in file" for every one of `keys` that an env file `next dev` loads from `dir` defines.
 * `resolveFrom` is any file inside the app, used to find the same copy of Next that the dev server runs.
 */
export function definedInNextEnvFiles(dir: string, keys: readonly string[], resolveFrom: string): string[] {
  const nextPackage = createRequire(resolveFrom).resolve('next/package.json');
  const loader = createRequire(nextPackage).resolve('@next/env');
  const output = execFileSync(process.execPath, ['-e', LOADER, loader, dir], { env: { NODE_ENV: 'development' }, encoding: 'utf8' });
  const files = JSON.parse(output) as Array<{ path: string; keys: string[] }>;
  return files.flatMap((file) => keys.filter((key) => file.keys.includes(key)).map((key) => `${key} in ${file.path}`));
}
