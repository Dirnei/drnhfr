import { parseLineCount, stdinLines } from '../pipeline';
import type { Command } from '../types';

export default {
  name: 'tail',
  usage: 'tail [-n count]',
  summary: 'only the last lines, 10 unless told otherwise',
  order: 17,
  run(arg, ctx) {
    const count = parseLineCount(arg);
    if (count === null) {
      ctx.printError(`tail: not a line count: ${arg.trim()}`);
      return;
    }
    const lines = stdinLines(ctx);
    if (lines === null) {
      ctx.printError('tail: nothing to cut, pipe something in: history | tail -n 3');
      return;
    }
    if (lines.length > 0 && count > 0) ctx.print(lines.slice(-count).join('\n'));
  },
} satisfies Command;
