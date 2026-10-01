import { z } from 'astro/zod';
import type { Locale } from '../i18n/locales';
import source from './skill-extras.json';

const localized = z.union([
  z.string().min(1),
  z.object({ de: z.string().min(1), en: z.string().min(1) }),
]);
type Localized = z.infer<typeof localized>;

const schema = z.object({
  projects: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        label: localized,
        href: localized,
        stack: z.array(localized).min(1),
      }),
    )
    .default([]),
  areas: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        label: localized,
        projects: z.array(z.string()).default([]),
        stack: z.array(localized).min(1),
      }),
    )
    .default([]),
  related: z.record(z.string(), z.array(localized).min(1)).default({}),
  platforms: z.array(localized).default([]),
  pairs: z.array(z.object({ tech: localized, with: z.array(localized).min(1) })).default([]),
});

const parsed = schema.parse(source);

const pick = (value: Localized, locale: Locale): string =>
  typeof value === 'string' ? value : value[locale];

export interface SkillExtras {
  /** Own projects without a project page, such as this site. */
  extraProjects: { id: string; label: string; href: string; stack: string[] }[];
  /** `projects` are project slugs that belong to this area. */
  areas: { id: string; label: string; projects: string[]; stack: string[] }[];
  /** Project slug to technologies it relates to without using them. */
  related: Record<string, string[]>;
  /** Technology to technologies it is used together with. */
  pairs: Record<string, string[]>;
  /** Technologies linked only through their pairs, never straight to a job or project. */
  platforms: string[];
}

export function skillExtrasFor(locale: Locale): SkillExtras {
  return {
    extraProjects: parsed.projects.map((project) => ({
      id: project.id,
      label: pick(project.label, locale),
      href: pick(project.href, locale),
      stack: project.stack.map((name) => pick(name, locale)),
    })),
    areas: parsed.areas.map((area) => ({
      id: area.id,
      label: pick(area.label, locale),
      projects: area.projects,
      stack: area.stack.map((name) => pick(name, locale)),
    })),
    related: Object.fromEntries(
      Object.entries(parsed.related).map(([slug, names]) => [
        slug,
        names.map((name) => pick(name, locale)),
      ]),
    ),
    platforms: parsed.platforms.map((name) => pick(name, locale)),
    pairs: Object.fromEntries(
      parsed.pairs.map((pair) => [
        pick(pair.tech, locale),
        pair.with.map((other) => pick(other, locale)),
      ]),
    ),
  };
}
