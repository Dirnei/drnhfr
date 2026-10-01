import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '../src/i18n/locales';
import { formatRange } from '../src/data/cv';

const root = join(process.cwd(), 'src', 'content', 'projects');
const slugs = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const TRANSLATED = ['title', 'summary', 'role'];

describe('every project keeps shared facts in one file', () => {
  for (const slug of slugs) {
    const files = readdirSync(join(root, slug));

    it(`${slug} has ${slug}.json and a text in every language`, () => {
      expect(files).toContain(`${slug}.json`);
      for (const locale of locales) expect(files).toContain(`${slug}.${locale}.md`);
    });

    for (const locale of locales) {
      it(`${slug}.${locale}.md holds only what gets translated`, () => {
        const text = readFileSync(join(root, slug, `${slug}.${locale}.md`), 'utf8');
        const front = text.split(/^---\r?$/m)[1];
        const keys = [...front.matchAll(/^(\w+):/gm)].map((match) => match[1]);
        expect(keys.sort()).toEqual([...TRANSLATED].sort());
      });
    }
  }
});

describe('project periods', () => {
  it('print a bare year as the year, and an open end per language', () => {
    expect(formatRange('2013', undefined, 'de')).toBe('2013 – heute');
    expect(formatRange('2013', undefined, 'en')).toBe('2013 – present');
    expect(formatRange('2017', '2020', 'en')).toBe('2017 – 2020');
    expect(formatRange('2020-04', '2025-01', 'de')).toBe('04.2020 – 01.2025');
  });
});
