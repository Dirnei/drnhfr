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
  order: 12,
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
    const { renderBanner } = await import('../font');
    ctx.printArt(renderBanner(text).join('\n'));
  },
} satisfies Command;
