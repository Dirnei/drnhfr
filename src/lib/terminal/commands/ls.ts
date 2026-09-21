import { copy } from '../copy';
import { formatListing } from '../fs';
import type { Command } from '../types';

export default {
  name: 'ls',
  usage: 'ls',
  summary: 'list the current directory',
  order: 1,
  run(_arg, ctx) {
    const listing = ctx.entries();
    if (listing.length === 0) {
      ctx.print(copy.emptyLs);
      return;
    }
    ctx.print(formatListing(listing));
  },
} satisfies Command;
