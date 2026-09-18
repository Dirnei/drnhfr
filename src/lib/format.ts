import type { Locale } from '../i18n/locales';

const tags: Record<Locale, string> = { de: 'de-DE', en: 'en-GB' };

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(tags[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
