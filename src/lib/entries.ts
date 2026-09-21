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
