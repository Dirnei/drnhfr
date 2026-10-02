import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import publicData from '../src/data/ctf/public.json';

const dist = join(process.cwd(), 'dist');
const COMPLETE_FLAG = /drnhfr\{[^{}]{16,}\}/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('sealed door data', () => {
  it('has one sealed file per door', () => {
    const sealed = readdirSync(join(process.cwd(), 'src', 'data', 'ctf')).filter((name) =>
      name.endsWith('.sealed.json'),
    );
    expect(sealed.sort()).toEqual(publicData.doors.map((door) => `${door}.sealed.json`).sort());
    expect(publicData.doors).toHaveLength(5);
  });
});

describe.skipIf(!existsSync(dist))('the built site', () => {
  const all = existsSync(dist) ? files(dist) : [];
  const text = (path: string) => readFileSync(path, 'utf8');
  const textual = all.filter((path) => /\.(html|js|json|xml|txt|css)$/.test(path));

  it('contains no complete flag', () => {
    const leaks = textual.filter((path) => COMPLETE_FLAG.test(text(path)));
    expect(leaks).toEqual([]);
  });

  it('keeps door pages out of the sitemap', () => {
    for (const path of all.filter((name) => /sitemap-\d+\.xml$/.test(name))) {
      expect(text(path)).not.toContain('/ctf/');
    }
  });

  it('keeps door pages out of the search index', () => {
    for (const lang of ['de', 'en']) {
      expect(text(join(dist, lang, 'search.json'))).not.toContain('/ctf/');
    }
  });

  for (const lang of ['de', 'en']) {
    for (const door of publicData.doors) {
      it(`ships /${lang}/ctf/${door}/ locked, noindex and without its story`, () => {
        const html = text(join(dist, lang, 'ctf', door, 'index.html'));
        expect(html).toContain('<meta name="robots" content="noindex">');
        expect(html).toMatch(/<div data-door-html[^>]*><\/div>/);
      });
    }
  }
});
