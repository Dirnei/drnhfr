import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://www.dirnhofer.net',
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
    sitemap({
      filter: (page) => !/\/(lebenslauf|cv)\/$/.test(page),
    }),
  ],
});
