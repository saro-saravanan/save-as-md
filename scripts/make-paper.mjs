// Draws the site's two paper textures (greyscale, tileable): a fine ground and a fibrous packet stock.
// Short fibres at random angles, a few flecks, and soft low-frequency mottling. Used with
// background-blend-mode: multiply over the paper colour. Run: node scripts/make-paper.mjs
import { writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SIZE = 384;

// Deterministic random numbers, so the textures are reproducible.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function paper({ seed, base, mottle, fibres, fibreDark, flecks }) {
  const rand = rng(seed);
  const px = new Float32Array(SIZE * SIZE).fill(base);
  const at = (x, y) => ((((y % SIZE) + SIZE) % SIZE) * SIZE) + (((x % SIZE) + SIZE) % SIZE);

  // Low-frequency mottling: a smooth, wrapping value-noise field.
  const cells = 6;
  const grid = Array.from({ length: cells * cells }, () => rand() * 2 - 1);
  const g = (i, j) => grid[((j + cells) % cells) * cells + ((i + cells) % cells)];
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const fx = (x / SIZE) * cells, fy = (y / SIZE) * cells;
      const i = Math.floor(fx), j = Math.floor(fy), u = smooth(fx - i), v = smooth(fy - j);
      const top = g(i, j) * (1 - u) + g(i + 1, j) * u;
      const bottom = g(i, j + 1) * (1 - u) + g(i + 1, j + 1) * u;
      px[y * SIZE + x] += (top * (1 - v) + bottom * v) * mottle;
    }
  }
  // Fine tooth: a little per-pixel grain.
  for (let k = 0; k < px.length; k++) px[k] += (rand() - 0.5) * 5;
  // Fibres: short strokes at random angles, mostly a touch darker, some lighter.
  for (let n = 0; n < fibres; n++) {
    const x0 = rand() * SIZE, y0 = rand() * SIZE, angle = rand() * Math.PI, len = 3 + rand() * 9;
    const tone = rand() < 0.8 ? -(fibreDark * (0.4 + rand() * 0.6)) : fibreDark * 0.5;
    for (let t = 0; t <= len; t += 0.5) {
      const x = Math.round(x0 + Math.cos(angle) * t), y = Math.round(y0 + Math.sin(angle) * t + Math.sin(t / 3) * 0.6);
      px[at(x, y)] += tone * 0.5;
    }
  }
  // Flecks: small dark specks of pulp.
  for (let n = 0; n < flecks; n++) {
    const x = Math.floor(rand() * SIZE), y = Math.floor(rand() * SIZE), r = rand() < 0.7 ? 0 : 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) px[at(x + dx, y + dy)] -= 22 + rand() * 18;
  }
  return Buffer.from(px.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
}

function save(name, pixels) {
  const pgm = `site/assets/${name}.pgm`;
  writeFileSync(pgm, Buffer.concat([Buffer.from(`P5 ${SIZE} ${SIZE} 255\n`), pixels]));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', pgm, '-c:v', 'libwebp', '-quality', '90', `site/assets/${name}.webp`]);
  rmSync(pgm);
}

save('paper-ground', paper({ seed: 11, base: 247, mottle: 7, fibres: 1400, fibreDark: 8, flecks: 50 }));
save('paper-stock', paper({ seed: 29, base: 244, mottle: 10, fibres: 3200, fibreDark: 11, flecks: 110 }));
console.log('Wrote site/assets/paper-ground.webp and paper-stock.webp');
