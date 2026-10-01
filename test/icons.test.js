// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SIZES = [16, 32, 48, 128];
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));

describe('toolbar icons', () => {
  for (const size of SIZES) {
    it(`icons/icon-${size}.png is a ${size}×${size} PNG`, () => {
      const png = readFileSync(`icons/icon-${size}.png`);
      expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      expect(png.toString('ascii', 12, 16)).toBe('IHDR');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([size, size]);
    });
  }

  it('declares the icons for the extension and the toolbar button', () => {
    const expected = Object.fromEntries(SIZES.map((s) => [String(s), `icons/icon-${s}.png`]));
    expect(manifest.icons).toEqual(expected);
    expect(manifest.action.default_icon).toEqual(expected);
  });
});
