import { stdinLines } from '../pipeline';
import type { Command } from '../types';

export default {
  name: 'wc',
  usage: 'wc [-l|-w|-c]',
  summary: 'count what is piped in, -l for lines only',
  order: 16,
  run(arg, ctx) {
    const lines = stdinLines(ctx);
    if (lines === null) {
      ctx.printError('wc: nothing to count, pipe something in: ls | wc -l');
      return;
    }
    const text = lines.join('\n');
    const counts: Record<string, number> = {
      '-l': lines.length,
      '-w': text.split(/\s+/).filter(Boolean).length,
      '-c': lines.length === 0 ? 0 : text.length + 1,
    };
    const flag = arg.trim();
    if (!flag) {
      ctx.print(Object.values(counts).map((count) => String(count).padStart(7)).join(' '));
      return;
    }
    if (!(flag in counts)) {
      ctx.printError(`wc: unknown option ${flag}, try -l, -w or -c`);
      return;
    }
    ctx.print(String(counts[flag]));
  },
} satisfies Command;
