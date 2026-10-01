import { stdinLines } from '../pipeline';
import type { Command } from '../types';

export default {
  name: 'uniq',
  usage: 'uniq [-c]',
  summary: 'fold repeated neighbouring lines, -c counts them',
  order: 19,
  run(arg, ctx) {
    const flag = arg.trim();
    if (flag && flag !== '-c') {
      ctx.printError(`uniq: unknown option ${flag}, try -c`);
      return;
    }
    const lines = stdinLines(ctx);
    if (lines === null) {
      ctx.printError('uniq: nothing to fold, pipe something in: history | sort | uniq -c');
      return;
    }
    const runs: Array<{ line: string; count: number }> = [];
    for (const line of lines) {
      const last = runs[runs.length - 1];
      if (last && last.line === line) last.count += 1;
      else runs.push({ line, count: 1 });
    }
    const out = runs.map(({ line, count }) =>
      flag ? `${String(count).padStart(7)} ${line}` : line,
    );
    if (out.length > 0) ctx.print(out.join('\n'));
  },
} satisfies Command;
