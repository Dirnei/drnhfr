import { renderHelp } from '../help-text';
import type { Command } from '../types';

export default {
  name: 'help',
  aliases: ['?'],
  usage: 'help, ?',
  summary: 'this list',
  order: 0,
  run(_arg, ctx) {
    ctx.print(renderHelp(ctx.commands(), ctx));
  },
} satisfies Command;
