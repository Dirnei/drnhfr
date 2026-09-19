import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

// Regression guard: the OG cards were regenerated from a hard-coded palette
// that drifted from tokens.css once (commit 2067ce0, --ink #131418) and
// drifted again after make-og.mjs was fixed to read tokens.css but nobody
// re-ran `npm run og` following the 0f6d68a palette lift (--ink -> #1b1d23).
// This samples a corner of each committed PNG — a plain background region,
// well clear of the logo mark (which starts at x=80,y=80) and the text
// (which starts at x=80) — and fails if it doesn't match the current
// --ink token, so a future palette change that forgets to regenerate the
// cards is caught here instead of shipping silently.
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
