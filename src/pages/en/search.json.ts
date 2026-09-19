import type { APIContext } from 'astro';
import { getPosts, getProjects } from '../../lib/entries';
import { slugOf } from '../../lib/ids';
import { routePath } from '../../i18n/routes';

export async function GET(_context: APIContext) {
  const [posts, projects] = await Promise.all([getPosts('en'), getProjects('en')]);

  const entries = [
    { title: 'Home', href: '/en/', kind: 'Page' },
    { title: 'Projects', href: routePath('projects', 'en'), kind: 'Page' },
    { title: 'Blog', href: routePath('blog', 'en'), kind: 'Page' },
    { title: 'CV', href: routePath('cv', 'en'), kind: 'Page' },
    { title: 'Contact', href: routePath('contact', 'en'), kind: 'Page' },
    { title: 'Imprint', href: routePath('imprint', 'en'), kind: 'Page' },
    { title: 'Privacy', href: routePath('privacy', 'en'), kind: 'Page' },
    ...projects.map((p) => ({
      title: p.data.title,
      href: `/en/projects/${slugOf(p.id)}/`,
      kind: 'Project',
    })),
    ...posts.map((p) => ({
      title: p.data.title,
      href: `/en/blog/${slugOf(p.id)}/`,
      kind: 'Article',
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
