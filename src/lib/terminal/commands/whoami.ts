import { copy } from '../copy';
import type { Command } from '../types';

export default {
  name: 'whoami',
  usage: 'whoami',
  summary: 'the user you are right now',
  order: 5,
  run(_arg, ctx) {
    /*
     * The username, like the real one — not a biography. `su` promotes guest
     * to root and `exit` demotes again, so this is the quickest way to check
     * which you are without reading the prompt. The bio lives in `neofetch`.
     */
    const user = ctx.isUnlocked() ? copy.promptUserRoot : copy.promptUser;
    ctx.print(user.split('@')[0]);
  },
} satisfies Command;
