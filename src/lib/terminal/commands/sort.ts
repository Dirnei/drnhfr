import { stdinLines } from '../pipeline';
import type { Command } from '../types';

export default {
  name: 'sort',
  usage: 'sort [-rn]',
  summary: 'sort the lines, -r reverses, -n compares numbers',
  order: 19,
  run(arg, ctx) {
    const flags = arg.trim();
    if (flags && !/^(-[rn]+\s*)+$/.test(flags)) {
      ctx.printError(`sort: unknown option ${flags}, try -r or -n`);
      return;
    }
    const lines = stdinLines(ctx);
    if (lines === null) {
      ctx.printError('sort: nothing to sort, pipe something in: ls | sort -r');
      return;
    }
    const numeric = flags.includes('n');
    const sorted = [...lines].sort((a, b) =>
      numeric ? (parseFloat(a) || 0) - (parseFloat(b) || 0) : a.localeCompare(b),
    );
    if (flags.includes('r')) sorted.reverse();
    if (sorted.length > 0) ctx.print(sorted.join('\n'));
  },
} satisfies Command;
