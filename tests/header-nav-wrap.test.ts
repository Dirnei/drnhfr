import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

describe('mobile header/footer do not overflow at phone widths', () => {
  it('BaseLayout wraps the header row and the footer list under a breakpoint', () => {
    const css = read('src/layouts/BaseLayout.astro');
    const media = css.match(/@media \(max-width:\s*[\d.]+r?em\)\s*{([\s\S]*?)\n  }\n/);
    expect(media, 'expected a narrow-width @media block in BaseLayout.astro').not.toBeNull();
    const block = media![1];
    expect(block).toMatch(/\.header-inner\s*{[^}]*flex-wrap:\s*wrap/);
    expect(block).toMatch(/\.nav\s*{[^}]*flex-basis:\s*100%/);
    expect(block).toMatch(/\.footer-list\s*{[^}]*flex-wrap:\s*wrap/);
  });

  it('SiteNav lets the nav list wrap under the same breakpoint', () => {
    const css = read('src/components/SiteNav.astro');
    expect(css).toMatch(/@media \(max-width:\s*[\d.]+r?em\)\s*{[\s\S]*\.nav-list\s*{[^}]*flex-wrap:\s*wrap/);
  });
});
