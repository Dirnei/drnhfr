import type { Command } from '../types';

export default {
  name: 'date',
  usage: 'date',
  summary: 'the time on your clock, not mine',
  order: 11,
  run(_arg, ctx) {
    /*
     * Deliberately the visitor's local time. This is a static site — there is
     * no server whose clock could be authoritative — and it is the same clock
     * `su` derives its password from, so it pays to be able to read it.
     */
    ctx.print(new Date().toString());
  },
} satisfies Command;
