import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://dirnhofer.net',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: true },
  },
  redirects: {
    '/': '/de/',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
  integrations: [
    // No `i18n` option here: @astrojs/sitemap's i18n mode pairs URLs by
    // matching the path after the locale prefix, which only works when both
    // locales use the same segment names. This site localises the segments
    // themselves (/de/projekte/ vs /en/projects/), so that pairing would be
    // wrong for most routes. The <head> hreflang alternates in
    // BaseLayout.astro are the correct, per-page source of truth instead.
    sitemap({
      // The CV is unlisted on purpose (reachable only via the terminal's
      // "su" command) — the sitemap must not be the thing that hands it
      // back to every crawler.
      filter: (page) => !/\/(lebenslauf|cv)\/$/.test(page),
    }),
  ],
});
