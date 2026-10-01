import * as esbuild from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ENTRIES = {
  background: 'src/background/background.js',
  content: 'src/content/main.js',
  offscreen: 'src/offscreen/offscreen.js',
  options: 'src/pages/options.js',
};
const STATIC = {
  'manifest.json': 'manifest.json',
  'offscreen.html': 'src/offscreen/offscreen.html',
  'options.html': 'src/pages/options.html',
  icons: 'icons',
};

// --e2e builds into dist-e2e/ with a test hook the end-to-end tests drive; the normal build drops it.
const e2e = process.argv.includes('--e2e');
const outdir = e2e ? 'dist-e2e' : 'dist';

const entryPoints = Object.fromEntries(Object.entries(ENTRIES).filter(([, p]) => existsSync(p)));
await mkdir(outdir, { recursive: true });
for (const [to, from] of Object.entries(STATIC)) if (existsSync(from)) await cp(from, `${outdir}/${to}`, { recursive: true });
if (!Object.keys(entryPoints).length) process.exit(0);

const ctx = await esbuild.context({
  entryPoints,
  bundle: true,
  outdir,
  format: 'iife',
  target: 'chrome120',
  define: { __E2E__: String(e2e) },
  minifySyntax: true, // drops the dead `if (false)` test-hook branch from the normal build
  logLevel: 'info',
});
if (process.argv.includes('--watch')) await ctx.watch();
else {
  await ctx.rebuild();
  await ctx.dispose();
}
