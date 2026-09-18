import type { APIContext } from 'astro';
import { getPosts, getProjects } from '../../lib/entries';
import { slugOf } from '../../lib/ids';
import { routePath } from '../../i18n/routes';

export async function GET(_context: APIContext) {
  const [posts, projects] = await Promise.all([getPosts('de'), getProjects('de')]);

  const entries = [
    { title: 'Startseite', href: '/de/', kind: 'Seite' },
    { title: 'Projekte', href: routePath('projects', 'de'), kind: 'Seite' },
    { title: 'Blog', href: routePath('blog', 'de'), kind: 'Seite' },
    { title: 'Lebenslauf', href: routePath('cv', 'de'), kind: 'Seite' },
    { title: 'Kontakt', href: routePath('contact', 'de'), kind: 'Seite' },
    ...projects.map((p) => ({
      title: p.data.title,
      href: `/de/projekte/${slugOf(p.id)}/`,
      kind: 'Projekt',
    })),
    ...posts.map((p) => ({
      title: p.data.title,
      href: `/de/blog/${slugOf(p.id)}/`,
      kind: 'Artikel',
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
