import type { Command } from '../types';

export default {
  name: 'restart',
  aliases: ['reboot'],
  usage: 'restart',
  summary: 'reboot, replay the boot sequence, re-lock the cv and every ctf door',
  order: 26,
  run(_arg, ctx) {
    ctx.reboot(true);
  },
} satisfies Command;
