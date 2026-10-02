import { copy } from '../copy';
import { dotfiles } from '../../ctf/terminal';
import { formatListing } from '../fs';
import type { Command } from '../types';

export default {
  name: 'ls',
  usage: 'ls [-a]',
  summary: 'list the current directory',
  order: 1,
  run(arg, ctx) {
    const all = /(^|\s)-\w*a/.test(arg);
    const hidden = all
      ? dotfiles(ctx.ctf()).map((file) => ({ href: file.name, type: 'file', kind: 'File' }))
      : [];
    const listing = [...ctx.entries(), ...hidden];
    if (listing.length === 0) {
      ctx.print(copy.emptyLs);
      return;
    }
    ctx.print(formatListing(listing));
  },
} satisfies Command;
