import { parseLineCount, stdinLines } from '../pipeline';
import type { Command } from '../types';

export default {
  name: 'head',
  usage: 'head [-n count]',
  summary: 'only the first lines, 10 unless told otherwise',
  order: 17,
  run(arg, ctx) {
    const count = parseLineCount(arg);
    if (count === null) {
      ctx.printError(`head: not a line count: ${arg.trim()}`);
      return;
    }
    const lines = stdinLines(ctx);
    if (lines === null) {
      ctx.printError('head: nothing to cut, pipe something in: help | head -n 3');
      return;
    }
    if (lines.length > 0 && count > 0) ctx.print(lines.slice(0, count).join('\n'));
  },
} satisfies Command;
