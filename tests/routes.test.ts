import { describe, expect, it } from 'vitest';
import { locales } from '../src/i18n/locales';
import { routePath, routeSegments, type RouteKey } from '../src/i18n/routes';

const keys = Object.keys(routeSegments) as RouteKey[];

describe('route segments', () => {
  for (const locale of locales) {
    it(`are unique within ${locale}`, () => {
      const segments = keys.map((key) => routeSegments[key][locale]);
      expect(new Set(segments).size).toBe(segments.length);
    });

    for (const key of keys) {
      const segment = routeSegments[key][locale];

      it(`${key}.${locale} is a bare url-safe segment`, () => {
        expect(segment).toMatch(/^[a-z0-9-]+$/);
      });

      it(`${key}.${locale} builds an absolute path`, () => {
        expect(routePath(key, locale)).toBe(`/${locale}/${segment}/`);
      });
    }
  }
});
