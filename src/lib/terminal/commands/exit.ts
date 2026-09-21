import { copy } from '../copy';
import type { Command } from '../types';

export default {
  name: 'exit',
  usage: 'exit',
  summary: 'drop back to guest and re-lock the cv',
  listed: (ctx) => ctx.isUnlocked(),
  order: 9,
  run(_arg, ctx) {
    const wasUnlocked = ctx.isUnlocked();
    ctx.setUnlocked(false);
    ctx.print(wasUnlocked ? copy.exitDone : copy.exitIdle);
  },
} satisfies Command;
