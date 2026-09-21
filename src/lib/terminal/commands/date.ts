import type { Command } from '../types';

export default {
  name: 'date',
  usage: 'date',
  summary: 'the time on your clock, not mine',
  order: 11,
  run(_arg, ctx) {
    ctx.print(new Date().toString());
  },
} satisfies Command;
