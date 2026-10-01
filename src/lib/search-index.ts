import type { Locale } from '../i18n/locales';
import { routePath, routeSegments } from '../i18n/routes';
import { useTranslations } from '../i18n/ui';
import { slugOf } from './ids';
import {
  getContactPage,
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
  /** Every language's name for this entry, so `cd contact` works on a German page. */
  aliases?: string[];
}

export async function searchIndex(locale: Locale): Promise<SearchEntry[]> {
  const t = useTranslations(locale);
  const pageKind = t('search.page');
  const projectKind = t('projects.kind');

  const pages = [
    { entry: await getProjectsPage(locale), key: 'projects' as const },
    { entry: await getContactPage(locale), key: 'contact' as const },
    { entry: await getLegalPage('imprint', locale), key: 'imprint' as const },
    { entry: await getLegalPage('privacy', locale), key: 'privacy' as const },
  ];

  const projectBase = routePath('projects', locale);
  const projects = await getProjects(locale);

  return [
    ...pages.map(({ entry, key }) => ({
      title: entry.data.search.title,
      href: routePath(key, locale),
      aliases: Object.values(routeSegments[key]),
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
