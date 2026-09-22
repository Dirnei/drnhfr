import type { APIContext } from 'astro';
import { locales, type Locale } from '../../i18n/locales';
import { searchIndex } from '../../lib/search-index';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

export async function GET({ params }: APIContext) {
  return new Response(JSON.stringify(await searchIndex(params.lang as Locale)), {
    headers: { 'Content-Type': 'application/json' },
  });
}
