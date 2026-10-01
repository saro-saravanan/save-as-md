import * as esbuild from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ENTRIES = {
  background: 'src/background/background.js',
  content: 'src/content/main.js',
  offscreen: 'src/offscreen/offscreen.js',
  options: 'src/pages/options.js',
  folder: 'src/pages/folder.js',
};
const STATIC = {
  'manifest.json': 'manifest.json',
  'offscreen.html': 'src/offscreen/offscreen.html',
  'options.html': 'src/pages/options.html',
  'folder.html': 'src/pages/folder.html',
  icons: 'icons',
};

// Entries appear task by task; build whatever exists so far.
const entryPoints = Object.fromEntries(Object.entries(ENTRIES).filter(([, p]) => existsSync(p)));
await mkdir('dist', { recursive: true });
for (const [to, from] of Object.entries(STATIC)) if (existsSync(from)) await cp(from, `dist/${to}`, { recursive: true });
if (!Object.keys(entryPoints).length) process.exit(0);

const ctx = await esbuild.context({
  entryPoints,
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'chrome120',
  logLevel: 'info',
});
if (process.argv.includes('--watch')) await ctx.watch();
else {
  await ctx.rebuild();
  await ctx.dispose();
}
