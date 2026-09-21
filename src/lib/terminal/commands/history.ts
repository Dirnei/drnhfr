import type { Command } from '../types';

export default {
  name: 'history',
  usage: 'history',
  summary: 'what you have typed so far',
  order: 13,
  run(_arg, ctx) {
    const entries = ctx.history();
    if (entries.length === 0) {
      ctx.print('(nothing yet)');
      return;
    }
    /*
     * Right-aligned numbers so the commands line up however long the list
     * gets, the same way the real one does.
     */
    const width = String(entries.length).length;
    ctx.print(
      entries
        .map((entry, index) => `${String(index + 1).padStart(width)}  ${entry}`)
        .join('\n'),
    );
  },
} satisfies Command;
