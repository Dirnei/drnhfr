import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Regression guard: at 375px viewport width, the header's logo + five-item
// nav (four links + lang switch) in one non-wrapping flex row overflowed the
// document by ~31px (document.documentElement.scrollWidth ~406 vs a 375
// viewport), and the footer's link list did the same by ~8px. The suite has
// no browser, so it can't assert scrollWidth directly (that would need a new
// dependency) — instead this asserts, in CSS-source terms, that the escape
// hatch is still wired up: a narrow-width media query that lets the header
// wrap the nav onto its own row and lets the footer's link list wrap, so a
// future edit can't silently delete the breakpoint and reintroduce the
// sideways scroll. See .superpowers/sdd/2026-09-18-dirnhofer-net/
// mobile-header-report.md for the before/after measurements.

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
