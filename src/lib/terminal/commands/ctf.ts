import { routePath } from '../../../i18n/routes';
import { asLocale } from '../../ctf/paths';
import { clock } from '../duration';
import type { Command } from '../types';

export default {
  name: 'ctf',
  usage: 'ctf',
  summary: 'start the capture the flag game',
  order: 27,
  run(_arg, ctx) {
    const ctf = ctx.ctf();
    const finished = ctf.finishedIn();
    if (!ctf.started()) {
      ctf.start(Date.now());
      ctx.print('ctf started. the clock is running, and submit and hint are now available.');
    } else if (finished !== null) {
      ctx.print(`every door is open. your time: ${clock(finished)}`);
    } else {
      ctx.print(`ctf running for ${clock(ctf.elapsed(Date.now()) ?? 0)}`);
    }
    const target = routePath('ctf', asLocale(ctx.config.lang));
    if (target !== ctx.path) ctx.navigate(target);
  },
} satisfies Command;
