import { copy } from '../copy';
import type { Command } from '../types';

export default {
  name: 'whoami',
  usage: 'whoami',
  summary: 'the user you are right now',
  order: 5,
  run(_arg, ctx) {
    const user = ctx.isUnlocked() ? copy.promptUserRoot : copy.promptUser;
    ctx.print(user.split('@')[0]);
  },
} satisfies Command;
