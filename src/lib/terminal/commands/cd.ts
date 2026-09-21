import { copy } from '../copy';
import type { Command } from '../types';

const HERE = new Set(['.', '..', '/', '~']);

export default {
  name: 'cd',
  usage: 'cd <target>',
  summary: 'move to <target> — ".." and "/" go back',
  order: 2,
  completesEntries: true,
  run(arg, ctx) {
    const trimmed = arg.trim();
    if (!trimmed || HERE.has(trimmed)) {
      // Flat filesystem: there is nowhere to go but here, so this is a
      // silent no-op — exactly what a real shell does with `cd ..` at `/`.
      return;
    }
    const entry = ctx.find(trimmed);
    if (!entry) {
      ctx.printError(copy.cdNotFoundPrefix + trimmed);
      return;
    }
    ctx.navigate(entry.href);
  },
} satisfies Command;
