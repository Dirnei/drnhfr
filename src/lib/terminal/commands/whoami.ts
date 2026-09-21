import { copy } from '../copy';
import type { Command } from '../types';

export default {
  name: 'whoami',
  usage: 'whoami',
  summary: 'who built this',
  order: 4,
  run(_arg, ctx) {
    ctx.print(copy.whoami);
  },
} satisfies Command;
