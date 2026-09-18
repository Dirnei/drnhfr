import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../../lib/entries';
import { slugOf } from '../../lib/ids';

export async function GET(context: APIContext) {
  const posts = await getPosts('de');
  return rss({
    title: 'Christian Dirnhofer — Blog',
    description: 'Artikel über verteilte Systeme, .NET und Basteleien.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/de/blog/${slugOf(post.id)}/`,
    })),
    customData: '<language>de-DE</language>',
  });
}
