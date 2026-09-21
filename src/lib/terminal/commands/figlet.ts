import type { Command } from '../types';

const MAX_CHARS = 30;

export default {
  name: 'figlet',
  usage: 'figlet <text>',
  summary: 'write it large',
  order: 17,
  async run(arg, ctx) {
    const text = arg.trim() || 'drnhfr';
    if (text.length > MAX_CHARS) {
      ctx.printError(`figlet: ${MAX_CHARS} characters is plenty`);
      return;
    }
    const { renderBanner, BLOCK_INK, ASCII_INK } = await import('../font');

    const reference = ctx.charWidth('M'.repeat(20));
    const blockWidth = ctx.charWidth(BLOCK_INK.repeat(20));
    const cellPerfect = reference > 0 && Math.abs(blockWidth - reference) < 0.05;

    ctx.printArt(renderBanner(text, cellPerfect ? BLOCK_INK : ASCII_INK).join('\n'));
  },
} satisfies Command;
