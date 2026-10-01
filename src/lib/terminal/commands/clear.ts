import type { Command } from '../types';

export default {
  name: 'clear',
  usage: 'clear',
  summary: 'clear the screen',
  order: 8,
  run(_arg, ctx) {
    ctx.clearScreen();
  },
} satisfies Command;
