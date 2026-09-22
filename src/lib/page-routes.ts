import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { locales, type Locale } from '../i18n/locales';
import { routeSegments, type RouteKey } from '../i18n/routes';

export type PageKey = RouteKey | 'home';

export interface ChildRoute {
  slug: string;
  component: AstroComponentFactory;
  props?: Record<string, unknown>;
}

export interface PageRoute {
  key: PageKey;
  component: AstroComponentFactory;
  props?: Record<string, unknown>;
  children?: (locale: Locale) => Promise<ChildRoute[]>;
}

export interface PageSlice {
  routes: PageRoute[];
}

const slices = import.meta.glob<{ default: PageSlice }>('../content/pages/*/route.ts', {
  eager: true,
});

export async function collectRoutes() {
  const paths = [];
  const declared = new Set<PageKey>();

  for (const slice of Object.values(slices)) {
    for (const route of slice.default.routes) {
      declared.add(route.key);
      for (const locale of locales) {
        const base = route.key === 'home' ? locale : `${locale}/${routeSegments[route.key][locale]}`;
        paths.push({
          params: { path: base },
          props: { Component: route.component, componentProps: { lang: locale, ...route.props } },
        });
        for (const child of (await route.children?.(locale)) ?? []) {
          paths.push({
            params: { path: `${base}/${child.slug}` },
            props: {
              Component: child.component,
              componentProps: { lang: locale, ...child.props },
            },
          });
        }
      }
    }
  }

  for (const key of Object.keys(routeSegments) as RouteKey[]) {
    if (!declared.has(key)) {
      throw new Error(
        `routeSegments.${key} has no page: add { key: '${key}' } to a src/page-content/*/route.ts`,
      );
    }
  }

  return paths;
}
