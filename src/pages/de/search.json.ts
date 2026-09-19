import type { APIContext } from 'astro';
import { getPosts, getProjects } from '../../lib/entries';
import { slugOf } from '../../lib/ids';
import { routePath } from '../../i18n/routes';

export async function GET(_context: APIContext) {
  const [posts, projects] = await Promise.all([getPosts('de'), getProjects('de')]);

  const entries = [
    { title: 'Startseite', href: '/de/', kind: 'Seite', type: 'page', description: 'Die Startseite mit Terminal.' },
    {
      title: 'Projekte',
      href: routePath('projects', 'de'),
      kind: 'Seite', type: 'page',
      description: 'Übersicht laufender und abgeschlossener Projekte.',
    },
    {
      title: 'Blog',
      href: routePath('blog', 'de'),
      kind: 'Seite', type: 'page',
      description: 'Artikel zu verteilten Systemen, .NET und Aktorenmodellen.',
    },
    {
      title: 'Kontakt',
      href: routePath('contact', 'de'),
      kind: 'Seite', type: 'page',
      description: 'Wie man Christian erreicht.',
    },
    {
      title: 'Impressum',
      href: routePath('imprint', 'de'),
      kind: 'Seite', type: 'page',
      description: 'Rechtliche Anbieterkennzeichnung.',
    },
    {
      title: 'Datenschutz',
      href: routePath('privacy', 'de'),
      kind: 'Seite', type: 'page',
      description: 'Datenschutzerklärung dieser Website.',
    },
    // Der Lebenslauf ist absichtlich nicht Teil dieses Index: er ist nur
    // über den "login"-Befehl im Terminal erreichbar, siehe Terminal.astro.
    ...projects.map((p) => ({
      title: p.data.title,
      href: `/de/projekte/${slugOf(p.id)}/`,
      kind: 'Projekt', type: 'project',
      description: p.data.summary,
    })),
    ...posts.map((p) => ({
      title: p.data.title,
      href: `/de/blog/${slugOf(p.id)}/`,
      kind: 'Artikel', type: 'post',
      description: p.data.description,
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
