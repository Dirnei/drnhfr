import { stdinLines } from '../pipeline';
import type { Command } from '../types';

const DEFAULT_COUNT = 10;

/** Accepts `-n 3`, `-n3` and `-3`, like the real one. */
export function parseCount(arg: string): number | null {
  const trimmed = arg.trim();
  if (!trimmed) return DEFAULT_COUNT;
  const match = trimmed.match(/^(?:-n\s*|-)(\d+)$/);
  return match ? Number(match[1]) : null;
}

export default {
  name: 'head',
  usage: 'head [-n count]',
  summary: 'only the first lines, 10 unless told otherwise',
  order: 15,
  run(arg, ctx) {
    const count = parseCount(arg);
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
