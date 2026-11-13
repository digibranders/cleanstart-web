// Bundles scripts/migrate.ts into one CommonJS file for the production image, which carries only the files Next
// traced (no tsx, no drizzle migrator). Run from the Dockerfile: node apps/portal/scripts/bundle-migrate.mjs
// esbuild is a dependency of tsx (a root devDependency), not of this app, so it is resolved through tsx and
// no dependency is added.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsxPackage = createRequire(path.join(appRoot, 'package.json')).resolve('tsx/package.json');
const esbuild = createRequire(tsxPackage)('esbuild');

await esbuild.build({
  entryPoints: [path.join(appRoot, 'scripts/migrate.ts')],
  outfile: path.join(appRoot, 'scripts/migrate.cjs'),
  tsconfig: path.join(appRoot, 'tsconfig.json'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: ['pg-native'],
  // CommonJS has no import.meta; keep scripts that read it working from the bundle's own location.
  define: { 'import.meta.url': '__importMetaUrl', 'import.meta.dirname': '__dirname' },
  banner: { js: "const __importMetaUrl = require('node:url').pathToFileURL(__filename).href;" },
  logLevel: 'info',
});
