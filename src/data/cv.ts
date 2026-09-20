import { z } from 'astro/zod';
import type { Locale } from '../i18n/locales';
import de from './cv.de.json';
import en from './cv.en.json';

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM');

const cvSchema = z.object({
  profile: z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    email: z.email(),
    /*
     * phone and birthDate are opt-in and empty by default, and the page skips
     * whatever is empty.
     *
     * The reason is not styling: the `su` gate hides the CV with a `hidden`
     * attribute in the browser, so the full markup is in the HTML that every
     * visitor and crawler downloads. Anything in these fields is on the open
     * web, gate or no gate — and the PDF is printed from that same page, so
     * there is no "PDF only" place to put them either.
     */
    phone: z.string(),
    birthDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    location: z.string().min(1),
    linkedin: z.url(),
    statement: z.string().min(1),
  }),
  experience: z
    .array(
      z.object({
        start: yearMonth,
        // null means "still there" and prints as heute / present.
        end: yearMonth.nullable(),
        organisation: z.string().min(1),
        role: z.string(),
        summary: z.string().min(1),
        stack: z.array(z.string().min(1)),
      }),
    )
    .min(1),
  education: z
    .array(
      z.object({
        start: yearMonth,
        title: z.string().min(1),
        organisation: z.string().min(1),
        note: z.string(),
      }),
    )
    .min(1),
  expertise: z
    .array(
      z.object({
        group: z.string().min(1),
        skills: z
          .array(z.object({ name: z.string().min(1), level: z.number().int().min(0).max(100) }))
          .min(1),
      }),
    )
    .min(1),
});

export type CV = z.infer<typeof cvSchema>;

/*
 * Parsed once at build time. A malformed date, a level of 120 or a missing
 * field is a build failure with a path to the offending key, rather than a
 * page that renders "undefined" to whoever unlocked it.
 */
const parsed: Record<Locale, CV> = {
  de: cvSchema.parse(de),
  en: cvSchema.parse(en),
};

export function cvFor(locale: Locale): CV {
  return parsed[locale];
}

/* Dates are stored as facts (YYYY-MM) and formatted per locale here, so the
   same month is never written twice in two notations. */
export function formatMonth(value: string, locale: Locale): string {
  const [year, month] = value.split('-');
  return locale === 'de' ? `${month}.${year}` : `${month}/${year}`;
}

export function formatRange(start: string, end: string | null, locale: Locale): string {
  const open = locale === 'de' ? 'heute' : 'present';
  return `${formatMonth(start, locale)} – ${end ? formatMonth(end, locale) : open}`;
}
