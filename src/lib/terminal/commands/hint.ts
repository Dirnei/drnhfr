import { pick } from '../../ctf/paths';
import type { Command } from '../types';

export default {
  name: 'hint',
  usage: 'hint',
  summary: 'a nudge towards the next flag',
  order: 28,
  run(_arg, ctx) {
    const result = ctx.ctf().hint();
    if (result.kind === 'done') {
      ctx.print('nothing left to find. every door is open.');
      return;
    }
    ctx.print(`hint: ${pick(result.text, ctx.config.lang)}`);
  },
} satisfies Command;
