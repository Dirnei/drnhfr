import { defaultLocale, isLocale, type Locale } from '../i18n/locales';

export function langOf(id: string): Locale {
  const prefix = id.split('/')[0];
  return isLocale(prefix) ? prefix : defaultLocale;
}

export function slugOf(id: string): string {
  const [prefix, ...rest] = id.split('/');
  return isLocale(prefix) ? rest.join('/') : id;
}
