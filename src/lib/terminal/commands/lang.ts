import type { Command } from '../types';

export default {
  name: 'lang',
  usage: 'lang',
  summary: 'switch between /de/ and /en/',
  order: 6,
  run(_arg, ctx) {
    ctx.navigate(ctx.config.otherHomeHref);
  },
} satisfies Command;
