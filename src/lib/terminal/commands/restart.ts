import type { Command } from '../types';

/*
 * reload just reloads. restart is the fun one: it clears the session flags so
 * the boot sequence plays again and the cv re-locks, which is otherwise only
 * possible by opening a private window.
 */
export default {
  name: 'restart',
  usage: 'restart',
  summary: 'reboot — replay the boot sequence, re-lock the cv',
  order: 10,
  run(_arg, ctx) {
    ctx.reboot(true);
  },
} satisfies Command;
