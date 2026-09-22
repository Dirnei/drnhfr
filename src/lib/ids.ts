import { defaultLocale, isLocale, type Locale } from '../i18n/locales';

export function langOf(id: string): Locale {
  const suffix = id.slice(id.lastIndexOf('.') + 1);
  return isLocale(suffix) ? suffix : defaultLocale;
}

export function slugOf(id: string): string {
  const cut = id.lastIndexOf('.');
  return cut > 0 && isLocale(id.slice(cut + 1)) ? id.slice(0, cut) : id;
}
