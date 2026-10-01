import { stdinLines } from '../pipeline';
import type { Command } from '../types';

export default {
  name: 'grep',
  usage: 'grep [-i] <word>',
  summary: 'keep only the lines that contain <word>, -i to ignore case',
  order: 15,
  run(arg, ctx) {
    const ignoreCase = /^-i\s/.test(arg.trim());
    const word = (ignoreCase ? arg.trim().slice(2) : arg).trim();
    if (!word) {
      ctx.printError('grep: what should I look for? try: ls | grep pro');
      return;
    }
    const lines = stdinLines(ctx);
    if (lines === null) {
      ctx.printError(`grep: nothing to search, pipe something in: help | grep ${word}`);
      return;
    }
    const fold = (text: string) => (ignoreCase ? text.toLowerCase() : text);
    const hits = lines.filter((line) => fold(line).includes(fold(word)));
    if (hits.length > 0) ctx.print(hits.join('\n'));
  },
} satisfies Command;
