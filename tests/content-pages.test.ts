import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '../src/i18n/locales';

const root = join(process.cwd(), 'src', 'content', 'pages');
const dirs = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe('every page has content in every language', () => {
  it('finds page slice directories', () => {
    expect(dirs.length).toBeGreaterThan(0);
  });

  for (const dir of dirs) {
    const files = readdirSync(join(root, dir)).filter((name) => name.endsWith('.md'));
    const keys = [...new Set(files.map((name) => name.replace(/\.(de|en)\.md$/, '')))];

    for (const key of keys) {
      for (const locale of locales) {
        it(`src/content/pages/${dir}/${key}.${locale}.md exists`, () => {
          expect(files).toContain(`${key}.${locale}.md`);
        });
      }
    }
  }
});
