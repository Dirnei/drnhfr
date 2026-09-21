import type { Command } from '../types';

export default {
  name: 'restart',
  usage: 'restart',
  summary: 'reboot — replay the boot sequence, re-lock the cv',
  order: 20,
  run(_arg, ctx) {
    ctx.reboot(true);
  },
} satisfies Command;
