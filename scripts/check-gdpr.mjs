import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const DIST = 'dist';
const ALLOWED_HOST = 'dirnhofer.net';
const SCANNABLE_EXTENSIONS = new Set(['.html', '.css', '.js', '.xml']);

const PATTERNS = [
  /\bsrc=["']([^"']+)["']/gi,
  /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["']/gi,
  /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']stylesheet["']/gi,
  /\burl\(\s*["']?([^"')]+)["']?\s*\)/gi,
  /\bfetch\(\s*["'`]([^"'`]+)["'`]/gi,
];

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

function isExternal(url) {
  if (!/^(?:[a-z]+:)?\/\//i.test(url)) return false;
  try {
    return new URL(url, `https://${ALLOWED_HOST}/`).hostname !== ALLOWED_HOST;
  } catch {
    return false;
  }
}

const files = await walk(DIST);
const scannable = files.filter((file) => SCANNABLE_EXTENSIONS.has(extname(file)));

const violations = [];
for (const file of scannable) {
  const text = await readFile(file, 'utf8');
  for (const pattern of PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      if (isExternal(match[1])) {
        violations.push(`${relative(DIST, file)} -> ${match[1]}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('External network requests found (GDPR: everything must be self-hosted):');
  for (const violation of violations) console.error('  ' + violation);
  process.exit(1);
}

console.log(`Checked ${scannable.length} files, no external network requests.`);
