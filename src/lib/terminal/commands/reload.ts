import type { Command } from '../types';

export default {
  name: 'reload',
  usage: 'reload',
  summary: 'reload the page',
  order: 18,
  run(_arg, ctx) {
    ctx.reboot(false);
  },
} satisfies Command;
