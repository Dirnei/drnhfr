import type { Command } from '../types';

export default {
  name: 'echo',
  usage: 'echo <text>',
  summary: 'say it back',
  order: 9,
  run(arg, ctx) {
    ctx.print(arg.trim());
  },
} satisfies Command;
