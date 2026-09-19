import type { APIContext } from 'astro';
import { getPosts, getProjects } from '../../lib/entries';
import { slugOf } from '../../lib/ids';
import { routePath } from '../../i18n/routes';

export async function GET(_context: APIContext) {
  const [posts, projects] = await Promise.all([getPosts('en'), getProjects('en')]);

  const entries = [
    { title: 'Home', href: '/en/', kind: 'Page', description: 'The home page, with a terminal.' },
    {
      title: 'Projects',
      href: routePath('projects', 'en'),
      kind: 'Page',
      description: 'Overview of past and current projects.',
    },
    {
      title: 'Blog',
      href: routePath('blog', 'en'),
      kind: 'Page',
      description: 'Articles on distributed systems, .NET and actor models.',
    },
    {
      title: 'Contact',
      href: routePath('contact', 'en'),
      kind: 'Page',
      description: 'How to reach Christian.',
    },
    {
      title: 'Imprint',
      href: routePath('imprint', 'en'),
      kind: 'Page',
      description: 'Legal notice.',
    },
    {
      title: 'Privacy',
      href: routePath('privacy', 'en'),
      kind: 'Page',
      description: 'Privacy policy of this website.',
    },
    // The CV is deliberately left out of this index: it's only reachable
    // via the terminal's "login" command, see Terminal.astro.
    ...projects.map((p) => ({
      title: p.data.title,
      href: `/en/projects/${slugOf(p.id)}/`,
      kind: 'Project',
      description: p.data.summary,
    })),
    ...posts.map((p) => ({
      title: p.data.title,
      href: `/en/blog/${slugOf(p.id)}/`,
      kind: 'Article',
      description: p.data.description,
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
