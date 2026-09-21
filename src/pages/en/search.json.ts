import type { APIContext } from 'astro';
import { getProjects } from '../../lib/entries';
import { slugOf } from '../../lib/ids';
import { routePath } from '../../i18n/routes';

export async function GET(_context: APIContext) {
  const projects = await getProjects('en');

  const entries = [
    { title: 'Home', href: '/en/', kind: 'Page', type: 'page', description: 'The home page, with a terminal.' },
    {
      title: 'Projects',
      href: routePath('projects', 'en'),
      kind: 'Page', type: 'page',
      description: 'Overview of past and current projects.',
    },
    {
      title: 'Contact',
      href: routePath('contact', 'en'),
      kind: 'Page', type: 'page',
      description: 'How to reach Christian.',
    },
    {
      title: 'Imprint',
      href: routePath('imprint', 'en'),
      kind: 'Page', type: 'page',
      description: 'Legal notice.',
    },
    {
      title: 'Privacy',
      href: routePath('privacy', 'en'),
      kind: 'Page', type: 'page',
      description: 'Privacy policy of this website.',
    },
    ...projects.map((p) => ({
      title: p.data.title,
      href: `/en/projects/${slugOf(p.id)}/`,
      kind: 'Project', type: 'project',
      description: p.data.summary,
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
