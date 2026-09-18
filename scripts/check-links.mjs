import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : full;
    }),
  );
  return files.flat();
}

const files = await walk(DIST);
const pages = files.filter((file) => file.endsWith('.html'));
const known = new Set(
  files.map((file) => '/' + relative(DIST, file).split('\\').join('/')),
);

const broken = [];

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);

  for (const href of hrefs) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (clean === '') continue;
    const candidates = [clean, `${clean}index.html`, clean.replace(/\/$/, '') + '/index.html'];
    if (!candidates.some((candidate) => known.has(candidate))) {
      broken.push(`${relative(DIST, page)} -> ${href}`);
    }
  }
}

if (broken.length > 0) {
  console.error('Broken internal links:');
  for (const entry of broken) console.error('  ' + entry);
  process.exit(1);
}

console.log(`Checked ${pages.length} pages, no broken internal links.`);
