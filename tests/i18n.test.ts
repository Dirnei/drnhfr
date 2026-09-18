import { describe, expect, it } from 'vitest';
import { isLocale, otherLocale } from '../src/i18n/locales';
import { useTranslations } from '../src/i18n/ui';
import { routePath } from '../src/i18n/routes';

describe('locales', () => {
  it('recognises supported locales', () => {
    expect(isLocale('de')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });

  it('returns the opposite locale', () => {
    expect(otherLocale('de')).toBe('en');
    expect(otherLocale('en')).toBe('de');
  });
});

describe('useTranslations', () => {
  it('returns the string for the requested locale', () => {
    expect(useTranslations('de')('nav.projects')).toBe('Projekte');
    expect(useTranslations('en')('nav.projects')).toBe('Projects');
  });
});

describe('routePath', () => {
  it('builds localized paths with German segments', () => {
    expect(routePath('projects', 'de')).toBe('/de/projekte/');
    expect(routePath('cv', 'de')).toBe('/de/lebenslauf/');
    expect(routePath('privacy', 'de')).toBe('/de/datenschutz/');
  });

  it('builds localized paths with English segments', () => {
    expect(routePath('projects', 'en')).toBe('/en/projects/');
    expect(routePath('cv', 'en')).toBe('/en/cv/');
    expect(routePath('privacy', 'en')).toBe('/en/privacy/');
  });
});
