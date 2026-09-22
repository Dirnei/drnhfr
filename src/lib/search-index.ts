import type { Locale } from '../i18n/locales';
import { routePath } from '../i18n/routes';
import { useTranslations } from '../i18n/ui';
import { slugOf } from './ids';
import {
  getContactPage,
  getHomePage,
  getLegalPage,
  getProjects,
  getProjectsPage,
} from './entries';

export interface SearchEntry {
  title: string;
  href: string;
  kind: string;
  type: 'page' | 'project';
  description: string;
}

export async function searchIndex(locale: Locale): Promise<SearchEntry[]> {
  const t = useTranslations(locale);
  const pageKind = t('search.page');
  const projectKind = t('projects.kind');

  const pages = [
    { entry: await getHomePage(locale), href: `/${locale}/` },
    { entry: await getProjectsPage(locale), href: routePath('projects', locale) },
    { entry: await getContactPage(locale), href: routePath('contact', locale) },
    { entry: await getLegalPage('imprint', locale), href: routePath('imprint', locale) },
    { entry: await getLegalPage('privacy', locale), href: routePath('privacy', locale) },
  ];

  const projectBase = routePath('projects', locale);
  const projects = await getProjects(locale);

  return [
    ...pages.map(({ entry, href }) => ({
      title: entry.data.search.title,
      href,
      kind: pageKind,
      type: 'page' as const,
      description: entry.data.search.description,
    })),
    ...projects.map((project) => ({
      title: project.data.title,
      href: `${projectBase}${slugOf(project.id)}/`,
      kind: projectKind,
      type: 'project' as const,
      description: project.data.summary,
    })),
  ];
}
