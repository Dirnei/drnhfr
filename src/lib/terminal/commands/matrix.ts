import type { Command } from '../types';

/*
 * ASCII only, and on purpose. The obvious choice is katakana, but this site
 * self-hosts a latin subset of its monospace face — anything outside it gets
 * substituted from another font with its own advance width, and a grid drawn
 * from mixed advances shears. The same reason figlet measures its ink before
 * using it.
 */
const CHARS = '01<>{}[]/\\|=+-*#$%&abcdefghijklmnopqrstuvwxyz';
const ROWS = 14;
const TAIL = 7;
const FRAME_MS = 70;
/* A hard stop, in case a tab is left running in a background window. */
const MAX_MS = 30000;

const pick = () => CHARS[Math.floor(Math.random() * CHARS.length)];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  name: 'matrix',
  usage: 'matrix',
  summary: 'follow the white rabbit — any key to stop',
  order: 18,
  async run(_arg, ctx) {
    const columns = Math.min(ctx.columns(), 120);
    const drawing = ctx.draw();

    if (ctx.reducedMotion()) {
      // One still frame: the joke survives, the falling does not.
      const still = Array.from({ length: 6 }, () =>
        Array.from({ length: columns }, () => (Math.random() < 0.25 ? pick() : ' ')).join(''),
      );
      drawing.update(still.join('\n'));
      return;
    }

    /* Persistent grid: only the head and the end of each tail change per
       frame, so the rain falls instead of reshuffling itself every tick. */
    const grid: string[][] = Array.from({ length: ROWS }, () => new Array(columns).fill(' '));
    const drops = Array.from({ length: columns }, () => -Math.floor(Math.random() * ROWS * 2));

    let stopped = false;
    void ctx.interrupted().then(() => {
      stopped = true;
    });

    const deadline = Date.now() + MAX_MS;
    try {
      while (!stopped && Date.now() < deadline) {
        for (let column = 0; column < columns; column += 1) {
          const head = drops[column];
          if (head >= 0 && head < ROWS) grid[head][column] = pick();
          const tail = head - TAIL;
          if (tail >= 0 && tail < ROWS) grid[tail][column] = ' ';
          drops[column] = head > ROWS + TAIL ? -Math.floor(Math.random() * ROWS) : head + 1;
        }
        drawing.update(grid.map((row) => row.join('').replace(/\s+$/, '')).join('\n'));
        await sleep(FRAME_MS);
      }
    } finally {
      drawing.end();
    }
  },
} satisfies Command;
