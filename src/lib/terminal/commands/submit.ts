import { pick } from '../../ctf/paths';
import { clock } from '../duration';
import type { Command } from '../types';

export default {
  name: 'submit',
  usage: 'submit <flag>',
  summary: 'hand in a flag and open a door',
  available: (ctx) => ctx.ctf().started(),
  order: 28,
  async run(arg, ctx) {
    const flag = arg.trim();
    if (!flag) {
      ctx.printError('submit: usage: submit <flag>');
      return;
    }
    const ctf = ctx.ctf();
    const result = await ctf.submit(flag);
    const total = ctf.finishedIn();
    const lang = ctx.config.lang;
    const title = (door: string) => pick(ctf.payload(door)!.title, lang);
    switch (result.kind) {
      case 'unsupported':
        ctx.printError('submit: this browser cannot check flags here (no WebCrypto in this context)');
        return;
      case 'wrong':
        ctx.printError('submit: no door opens with that');
        return;
      case 'already':
        ctx.print(`submit: that flag already opened "${title(result.door)}"`);
        return;
      case 'opened':
        ctx.print(`door opened: ${title(result.door)}  (${ctf.opened().length}/${ctf.doors.length})`);
        ctx.print(`cd ctf/${result.door}`);
        if (total !== null) ctx.print(`every door is open. your time: ${clock(total)}`);
        if (!result.persisted) {
          ctx.print('note: storage is blocked, so this door closes again on the next page');
        }
    }
  },
} satisfies Command;
