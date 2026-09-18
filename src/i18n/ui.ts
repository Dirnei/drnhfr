import type { Locale } from './locales';
import { de } from './de';
import { en } from './en';

export type UIKey = keyof typeof de;

const dictionaries = { de, en } as const;

export function useTranslations(locale: Locale): (key: UIKey) => string {
  const dict = dictionaries[locale];
  return (key: UIKey) => dict[key];
}
