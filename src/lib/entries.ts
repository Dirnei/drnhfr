import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/locales';
import { langOf } from './ids';

const showDrafts = import.meta.env.DEV;

export async function getPosts(locale: Locale): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog', ({ id, data }) => {
    return langOf(id) === locale && (showDrafts || !data.draft);
  });
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getProjects(locale: Locale): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects', ({ id }) => langOf(id) === locale);
  return projects.sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    return a.data.order - b.data.order;
  });
}

export async function getPostsForProject(
  projectId: string,
  locale: Locale,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getPosts(locale);
  return posts.filter((post) => post.data.project?.id === projectId);
}
