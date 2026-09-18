import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../../lib/entries';
import { slugOf } from '../../lib/ids';

export async function GET(context: APIContext) {
  const posts = await getPosts('en');
  return rss({
    title: 'Christian Dirnhofer — Blog',
    description: 'Articles on distributed systems, .NET, and whatever I take apart in the evening.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/en/blog/${slugOf(post.id)}/`,
    })),
    customData: '<language>en-GB</language>',
  });
}
