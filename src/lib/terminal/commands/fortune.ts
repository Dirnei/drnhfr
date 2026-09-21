import type { Command } from '../types';

export default {
  name: 'fortune',
  usage: 'fortune',
  summary: 'an opinion, at random',
  order: 15,
  async run(_arg, ctx) {
    // Lazy, like the figlet font: nobody downloads the fortunes until the
    // first time somebody asks for one.
    const { FORTUNES } = await import('../fortunes');
    ctx.print(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
  },
} satisfies Command;
