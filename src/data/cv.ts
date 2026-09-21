import { z } from 'astro/zod';
import type { Locale } from '../i18n/locales';
import source from './cv.json';

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM');

const localized = z.union([
  z.string().min(1),
  z.object({ de: z.string().min(1), en: z.string().min(1) }),
]);
type Localized = z.infer<typeof localized>;

/* Optional prose: "" means the field is simply absent for this entry. */
const optionalLocalized = z.union([z.literal(''), localized]);
type OptionalLocalized = z.infer<typeof optionalLocalized>;

const cvSchema = z.object({
  profile: z.object({
    name: z.string().min(1),
    title: localized,
    email: z.email(),
    phone: z.string(),
    birthDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    location: localized,
    linkedin: z.url(),
    statement: localized,
  }),
  experience: z
    .array(
      z.object({
        start: yearMonth,
        // null means "still there" and prints as heute / present.
        end: yearMonth.nullable(),
        organisation: z.string().min(1),
        role: optionalLocalized,
        summary: localized,
        stack: z.array(z.string().min(1)),
      }),
    )
    .min(1),
  education: z
    .array(
      z.object({
        start: yearMonth,
        title: localized,
        organisation: z.string().min(1),
        note: optionalLocalized,
      }),
    )
    .min(1),
  expertise: z
    .array(
      z.object({
        group: localized,
        skills: z
          .array(z.object({ name: localized, level: z.number().int().min(0).max(100) }))
          .min(1),
      }),
    )
    .min(1),
});

export interface CV {
  profile: {
    name: string;
    title: string;
    email: string;
    phone: string;
    birthDate: string;
    location: string;
    linkedin: string;
    statement: string;
  };
  experience: {
    start: string;
    end: string | null;
    organisation: string;
    role: string;
    summary: string;
    stack: string[];
  }[];
  education: { start: string; title: string; organisation: string; note: string }[];
  expertise: { group: string; skills: { name: string; level: number }[] }[];
}

const parsed = cvSchema.parse(source);

const pick = (value: Localized, locale: Locale): string =>
  typeof value === 'string' ? value : value[locale];
const pickOptional = (value: OptionalLocalized, locale: Locale): string =>
  value === '' ? '' : pick(value, locale);

function resolve(locale: Locale): CV {
  const { profile } = parsed;
  return {
    profile: {
      name: profile.name,
      title: pick(profile.title, locale),
      email: profile.email,
      phone: profile.phone,
      birthDate: profile.birthDate,
      location: pick(profile.location, locale),
      linkedin: profile.linkedin,
      statement: pick(profile.statement, locale),
    },
    experience: parsed.experience.map((entry) => ({
      start: entry.start,
      end: entry.end,
      organisation: entry.organisation,
      role: pickOptional(entry.role, locale),
      summary: pick(entry.summary, locale),
      stack: entry.stack,
    })),
    education: parsed.education.map((entry) => ({
      start: entry.start,
      title: pick(entry.title, locale),
      organisation: entry.organisation,
      note: pickOptional(entry.note, locale),
    })),
    expertise: parsed.expertise.map((group) => ({
      group: pick(group.group, locale),
      skills: group.skills.map((skill) => ({
        name: pick(skill.name, locale),
        level: skill.level,
      })),
    })),
  };
}

const resolved: Record<Locale, CV> = { de: resolve('de'), en: resolve('en') };

export function cvFor(locale: Locale): CV {
  return resolved[locale];
}

export function formatMonth(value: string, locale: Locale): string {
  const [year, month] = value.split('-');
  return locale === 'de' ? `${month}.${year}` : `${month}/${year}`;
}

export function formatRange(start: string, end: string | null, locale: Locale): string {
  const open = locale === 'de' ? 'heute' : 'present';
  return `${formatMonth(start, locale)} – ${end ? formatMonth(end, locale) : open}`;
}
