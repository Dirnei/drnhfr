import { copy } from '../copy';
import { nameFromHref } from '../fs';
import { codeMatches } from '../unlock';
import type { Command } from '../types';

export default {
  name: 'su',
  usage: 'su <password>',
  summary: 'become root and unlock the cv',
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
    ctx.print(copy.suSuccess);
    ctx.print(copy.suHintPrefix + nameFromHref(ctx.config.cvHref));
  },
} satisfies Command;
