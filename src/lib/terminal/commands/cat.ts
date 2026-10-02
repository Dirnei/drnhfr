import { findDotfile } from '../../ctf/terminal';
import { copy } from '../copy';
import type { Command } from '../types';

export default {
  name: 'cat',
  usage: 'cat <target>',
  summary: 'show a short description of <target>',
  order: 3,
  completesEntries: true,
  run(arg, ctx) {
    const trimmed = arg.trim();
    if (!trimmed && ctx.stdin !== null) {
      ctx.print(ctx.stdin);
      return;
    }
    if (!trimmed) {
      ctx.printError(copy.catMissing);
      return;
    }
    const file = findDotfile(ctx.ctf(), trimmed);
    if (file) {
      ctx.print(file.content);
      return;
    }
    const entry = ctx.find(trimmed);
    if (!entry) {
      ctx.printError(copy.catNotFoundPrefix + trimmed);
      return;
    }
    ctx.print(entry.description || copy.catNoDescription);
  },
} satisfies Command;
