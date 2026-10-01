import names from '../data/tech-icons.json';
import { canonicalTech } from './skill-graph';

export interface TechIcon {
  slug: string;
  viewBox: string;
  body: string;
}

const files = import.meta.glob<string>('../assets/tech/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const icons = new Map<string, TechIcon>(
  Object.entries(files).map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace(/\.svg$/, '');
    const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24';
    const body = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    return [slug, { slug, viewBox, body }];
  }),
);

export function iconSlug(name: string): string | undefined {
  return (names as Record<string, string>)[canonicalTech(name)];
}

export function techIcon(name: string): TechIcon | undefined {
  const slug = iconSlug(name);
  return slug ? icons.get(slug) : undefined;
}

export function iconBySlug(slug: string): TechIcon | undefined {
  return icons.get(slug);
}
