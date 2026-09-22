import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/locales';
import { langOf } from './ids';

export async function getProjects(locale: Locale): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects', ({ id }) => langOf(id) === locale);
  return projects.sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    return a.data.order - b.data.order;
  });
}

export type LegalPage = 'imprint' | 'privacy';

function pick<T extends { id: string }>(entries: T[], dir: string, id: string): T {
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing page content: src/content/pages/${dir}/${id}.md`);
  return entry;
}

export async function getHomePage(locale: Locale): Promise<CollectionEntry<'home'>> {
  return pick(await getCollection('home'), 'home', `home.${locale}`);
}

export async function getContactPage(locale: Locale): Promise<CollectionEntry<'contact'>> {
  return pick(await getCollection('contact'), 'contact', `contact.${locale}`);
}

export async function getLegalPage(
  page: LegalPage,
  locale: Locale,
): Promise<CollectionEntry<'legal'>> {
  return pick(await getCollection('legal'), 'legal', `${page}.${locale}`);
}

export async function getCvGatePage(locale: Locale): Promise<CollectionEntry<'cvGate'>> {
  return pick(await getCollection('cvGate'), 'cv', `cv.${locale}`);
}

export async function getProjectsPage(
  locale: Locale,
): Promise<CollectionEntry<'projectsIndex'>> {
  return pick(await getCollection('projectsIndex'), 'projects', `projects.${locale}`);
}

export async function getNotFoundPage(locale: Locale): Promise<CollectionEntry<'notFound'>> {
  return pick(await getCollection('notFound'), 'notfound', `notfound.${locale}`);
}
