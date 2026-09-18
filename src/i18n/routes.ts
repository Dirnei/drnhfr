import type { Locale } from './locales';

export const routeSegments = {
  projects: { de: 'projekte', en: 'projects' },
  blog: { de: 'blog', en: 'blog' },
  cv: { de: 'lebenslauf', en: 'cv' },
  contact: { de: 'kontakt', en: 'contact' },
  imprint: { de: 'impressum', en: 'imprint' },
  privacy: { de: 'datenschutz', en: 'privacy' },
} as const;

export type RouteKey = keyof typeof routeSegments;

export function routePath(key: RouteKey, locale: Locale): string {
  return `/${locale}/${routeSegments[key][locale]}/`;
}
