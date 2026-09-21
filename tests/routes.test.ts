import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '../src/i18n/locales';
import { routeSegments } from '../src/i18n/routes';

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
