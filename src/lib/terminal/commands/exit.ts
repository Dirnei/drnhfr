import { copy } from '../copy';
import type { Command } from '../types';

/*
 * Drops the same sessionStorage flag that `su` sets, which demotes the prompt
 * back to guest. The cv page re-reads the flag on every load, so clearing it
 * here is the whole of it — there is no server-side session to end, and
 * nothing to navigate away from: the terminal only exists on the home page.
 *
 * Exiting when you are already guest is not a failure, so it reports rather
 * than errors and leaves the status segment alone.
 */
export default {
  name: 'exit',
  usage: 'exit',
  summary: 'drop back to guest and re-lock the cv',
  order: 8,
  run(_arg, ctx) {
    const wasUnlocked = ctx.isUnlocked();
    ctx.setUnlocked(false);
    ctx.print(wasUnlocked ? copy.exitDone : copy.exitIdle);
  },
} satisfies Command;
