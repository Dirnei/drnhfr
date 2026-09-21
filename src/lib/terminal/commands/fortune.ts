import type { Command } from '../types';

export default {
  name: 'fortune',
  usage: 'fortune',
  summary: 'an opinion, at random',
  order: 15,
  async run(_arg, ctx) {
    const { FORTUNES } = await import('../fortunes');
    ctx.print(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
  },
} satisfies Command;
