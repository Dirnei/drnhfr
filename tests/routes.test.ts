import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '../src/i18n/locales';
import { routeSegments } from '../src/i18n/routes';

// T1 — route/filesystem parity. routePath() feeds the nav, the footer, both
// search indexes and every altHref, so one wrong segment in routeSegments
// (a typo, a segment renamed on one side only) breaks all of those at once
// without astro check or a build ever catching it — the string is valid
// either way, it just doesn't point at a real page.
describe('routeSegments matches an actual page on disk', () => {
  for (const key of Object.keys(routeSegments) as (keyof typeof routeSegments)[]) {
    for (const locale of locales) {
      const segment = routeSegments[key][locale];
      it(`src/pages/${locale}/${segment}/index.astro exists (routeSegments.${key}.${locale})`, () => {
        const path = join(process.cwd(), 'src', 'pages', locale, segment, 'index.astro');
        expect(existsSync(path)).toBe(true);
      });
    }
  }
});
