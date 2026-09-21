import { copy } from '../copy';
import { nameFromHref } from '../fs';
import { codeMatches } from '../unlock';
import type { Command } from '../types';

export default {
  name: 'su',
  usage: 'su <password>',
  summary: 'become root and unlock the cv',
  // The mirror of exit: pointless once you already are root.
  listed: (ctx) => !ctx.isUnlocked(),
  order: 8,
  run(arg, ctx) {
    const code = arg.trim();
    if (!code) {
      ctx.printError(copy.suMissing);
      return;
    }
    if (!codeMatches(code)) {
      ctx.printError(copy.suWrong);
      return;
    }
    ctx.setUnlocked(true);
    /*
     * Deliberately no redirect: being dropped onto another page is a jarring
     * reward for typing a command. The cv is now listed in the header and
     * navigable from here, and the shell refreshes the status line after
     * every command, so the prompt turns into root as the next line is drawn.
     */
    ctx.print(copy.suSuccess);
    ctx.print(copy.suHintPrefix + nameFromHref(ctx.config.cvHref));
  },
} satisfies Command;
