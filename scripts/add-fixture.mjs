import { copyFile } from 'node:fs/promises';

const [src, name] = process.argv.slice(2);
if (!src || !name) {
  console.error('Usage: npm run add-fixture -- "<path to .source.html>" <short-name>');
  process.exit(1);
}
await copyFile(src, `test/fixtures/pages/${name}.html`);
console.log(`Added test/fixtures/pages/${name}.html. Run "npm test" to create its expected .md, then review it.`);
