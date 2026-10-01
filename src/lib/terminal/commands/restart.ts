import type { Command } from '../types';

export default {
  name: 'restart',
  usage: 'restart',
  summary: 'reboot, replay the boot sequence and re-lock the cv',
  order: 21,
  run(_arg, ctx) {
    ctx.reboot(true);
  },
} satisfies Command;
