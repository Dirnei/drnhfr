import type { Command } from '../types';

/*
 * A cap, not a scrollbar problem: every glyph is six columns wide, so thirty
 * characters is already a 180-column banner. Past that it stops being a
 * banner and starts being a denial-of-service on your own scrollback.
 */
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
    /*
     * The font is the heaviest thing in the terminal and most visitors will
     * never type `figlet`, so it is fetched on first use rather than shipped
     * with the shell. Vite splits it into its own chunk automatically; the
     * module cache means the second call costs nothing.
     *
     * The metadata above stays static on purpose — `help` and tab completion
     * have to know this command exists without paying for its payload.
     */
    const { renderBanner, BLOCK_INK, ASCII_INK } = await import('../font');

    /*
     * Check the ink before drawing with it. The banner is a grid, and a grid
     * only holds if every cell is the same width — but U+2588 is outside the
     * latin subset this site self-hosts, and font-display: optional means the
     * glyph that actually renders may be substituted from some other font
     * with its own advance width. Half a pixel of drift per column shears the
     * whole banner. '#' is Basic Latin and cannot be substituted away.
     */
    const reference = ctx.charWidth('M'.repeat(20));
    const blockWidth = ctx.charWidth(BLOCK_INK.repeat(20));
    const cellPerfect = reference > 0 && Math.abs(blockWidth - reference) < 0.05;

    ctx.printArt(renderBanner(text, cellPerfect ? BLOCK_INK : ASCII_INK).join('\n'));
  },
} satisfies Command;
