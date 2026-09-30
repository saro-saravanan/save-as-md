import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { capturePage } from '../src/lib/pipeline.js';
import { assembleDocument, remoteResults } from '../src/lib/assemble.js';

// jsdom replaces the global URL, which node:fs rejects, so use plain paths.
const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'pages');
const pages = readdirSync(dir).filter((f) => f.endsWith('.html'));

describe('regression set', () => {
  for (const name of pages) {
    it(`converts ${name} as before`, async () => {
      const html = readFileSync(join(dir, name), 'utf8');
      const url = /<!-- saved from (\S+)/.exec(html)?.[1] ?? 'https://example.com/';
      const doc = new JSDOM(html, { url }).window.document;
      const capture = capturePage(doc, { url, now: new Date('2026-01-01T00:00:00.000Z') });
      await expect(assembleDocument(capture, remoteResults(capture.images)))
        .toMatchFileSnapshot(`./fixtures/expected/${name.replace(/\.html$/, '.md')}`);
    });
  }
});
