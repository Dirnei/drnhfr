import { routePath } from '../../i18n/routes';
import type { Locale } from '../../i18n/locales';
import type { Localised } from './doors';

export function doorHref(lang: string, door: string): string {
  return `${routePath('ctf', asLocale(lang))}${door}/`;
}

export function asLocale(lang: string): Locale {
  return lang === 'en' ? 'en' : 'de';
}

export function pick(text: Localised, lang: string): string {
  return text[asLocale(lang)];
}
