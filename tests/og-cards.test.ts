import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

function readInkToken(): string {
  const tokensCss = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
  const match = tokensCss.match(/--ink:\s*(#[0-9a-fA-F]{3,8})/);
  if (!match) throw new Error('could not find --ink in src/styles/tokens.css');
  return match[1].toLowerCase();
}

async function sampleCorner(pngPath: string): Promise<string> {
  const { data } = await sharp(pngPath)
    .extract({ left: 5, top: 5, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return (
    '#' +
    Array.from(data.subarray(0, 3))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  );
}

describe('OG card ground colour matches tokens.css --ink', () => {
  for (const lang of ['de', 'en'] as const) {
    it(`public/og-${lang}.png background matches --ink`, async () => {
      const ink = readInkToken();
      const sampled = await sampleCorner(join(process.cwd(), `public/og-${lang}.png`));
      expect(sampled).toBe(ink);
    });
  }
});
