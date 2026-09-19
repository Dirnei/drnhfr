import type { APIContext } from 'astro';
import { getPosts, getProjects } from '../../lib/entries';
import { slugOf } from '../../lib/ids';
import { routePath } from '../../i18n/routes';

export async function GET(_context: APIContext) {
  const [posts, projects] = await Promise.all([getPosts('de'), getProjects('de')]);

  const entries = [
    { title: 'Startseite', href: '/de/', kind: 'Seite', description: 'Die Startseite mit Terminal.' },
    {
      title: 'Projekte',
      href: routePath('projects', 'de'),
      kind: 'Seite',
      description: 'Übersicht laufender und abgeschlossener Projekte.',
    },
    {
      title: 'Blog',
      href: routePath('blog', 'de'),
      kind: 'Seite',
      description: 'Artikel zu verteilten Systemen, .NET und Aktorenmodellen.',
    },
    {
      title: 'Kontakt',
      href: routePath('contact', 'de'),
      kind: 'Seite',
      description: 'Wie man Christian erreicht.',
    },
    {
      title: 'Impressum',
      href: routePath('imprint', 'de'),
      kind: 'Seite',
      description: 'Rechtliche Anbieterkennzeichnung.',
    },
    {
      title: 'Datenschutz',
      href: routePath('privacy', 'de'),
      kind: 'Seite',
      description: 'Datenschutzerklärung dieser Website.',
    },
    // Der Lebenslauf ist absichtlich nicht Teil dieses Index: er ist nur
    // über den "login"-Befehl im Terminal erreichbar, siehe Terminal.astro.
    ...projects.map((p) => ({
      title: p.data.title,
      href: `/de/projekte/${slugOf(p.id)}/`,
      kind: 'Projekt',
      description: p.data.summary,
    })),
    ...posts.map((p) => ({
      title: p.data.title,
      href: `/de/blog/${slugOf(p.id)}/`,
      kind: 'Artikel',
      description: p.data.description,
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
