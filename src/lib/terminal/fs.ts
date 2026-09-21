import type { SearchEntry } from './types';

/** "/de/projekte/akka-cluster/" -> "akka-cluster" */
export function nameFromHref(href: string): string {
  const trimmed = href.replace(/\/+$/, '');
  const parts = trimmed.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

/*
 * `kind` in the search index is a localized label the site shows to the
 * visitor; `type` is the stable key. The terminal keys off `type`, so a German
 * index still prints English labels here and nothing breaks if the German
 * wording is ever reworded.
 */
export const TYPE_LABEL: Record<string, string> = {
  page: 'Page',
  project: 'Project',
  post: 'Article',
};
const TYPE_ORDER: Record<string, number> = { page: 0, project: 1, post: 2 };

export function isPageType(type: string): boolean {
  return type === 'page';
}

/** Case-insensitive lookup of a bare name against a listing. */
export function findIn(entries: SearchEntry[], argRaw: string): SearchEntry | undefined {
  const needle = argRaw.trim().replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
  if (!needle) return undefined;
  return entries.find((entry) => nameFromHref(entry.href).toLowerCase() === needle);
}

/**
 * The `ls` table: pages first, then projects, then articles, alphabetical
 * within each group, with the kind column aligned to the longest name.
 * Pure, so tests can assert the exact text without a browser.
 */
export function formatListing(entries: SearchEntry[]): string {
  const rows = entries
    .map((entry) => ({
      name: nameFromHref(entry.href) + (isPageType(entry.type) ? '/' : ''),
      kind: TYPE_LABEL[entry.type] ?? entry.kind ?? '',
      type: entry.type,
    }))
    .sort((a, b) => {
      const order = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9);
      return order !== 0 ? order : a.name.localeCompare(b.name);
    });
  const width = Math.max(...rows.map((row) => row.name.length)) + 2;
  return rows.map((row) => row.name.padEnd(width) + row.kind).join('\n');
}
