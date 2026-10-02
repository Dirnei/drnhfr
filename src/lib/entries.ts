import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/locales';
import { langOf, slugOf } from './ids';

export type ProjectFacts = CollectionEntry<'projectFacts'>['data'];
export type Project = CollectionEntry<'projects'> & { facts: ProjectFacts };

/** Each project's text in `locale`, joined with the facts every language shares. */
export async function getProjects(locale: Locale): Promise<Project[]> {
  const facts = new Map((await getCollection('projectFacts')).map((entry) => [entry.id, entry.data]));
  const texts = await getCollection('projects', ({ id }) => langOf(id) === locale);
  for (const slug of facts.keys()) {
    if (!texts.some((entry) => slugOf(entry.id) === slug)) {
      throw new Error(`Missing project text: src/content/projects/${slug}/${slug}.${locale}.md`);
    }
  }
  const projects = texts.map((entry) => {
    const slug = slugOf(entry.id);
    const shared = facts.get(slug);
    if (!shared) throw new Error(`Missing project facts: src/content/projects/${slug}/${slug}.json`);
    return { ...entry, facts: shared };
  });
  return projects.sort((a, b) => {
    if (a.facts.featured !== b.facts.featured) return a.facts.featured ? -1 : 1;
    return a.facts.order - b.facts.order;
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

export async function getSkillsPage(locale: Locale): Promise<CollectionEntry<'skills'>> {
  return pick(await getCollection('skills'), 'skills', `skills.${locale}`);
}

export async function getCtfPage(locale: Locale): Promise<CollectionEntry<'ctf'>> {
  return pick(await getCollection('ctf'), 'ctf', `ctf.${locale}`);
}

export async function getCtfHelpPages(locale: Locale): Promise<CollectionEntry<'ctfHelp'>[]> {
  return getCollection('ctfHelp', ({ id }) => langOf(id) === locale);
}

export async function getNotFoundPage(locale: Locale): Promise<CollectionEntry<'notFound'>> {
  return pick(await getCollection('notFound'), 'notfound', `notfound.${locale}`);
}
