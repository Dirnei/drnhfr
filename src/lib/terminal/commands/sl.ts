import type { Command } from '../types';

/*
 * `sl` — the 1993 joke by Toyoda Masashi: you meant to type `ls`, your fingers
 * disagreed, and a steam locomotive drives across the terminal while you wait.
 *
 * hidden: true on purpose. It is not in `help` and Tab will not complete it,
 * because the discovery mechanism IS the typo. Putting it in the menu would
 * be like explaining the joke.
 */

/** The boiler, cab and tender. Constant across every frame. */
const BODY = [
  '      ====        ________                ___________',
  '  _D _|  |_______/        \\__I_I_____===__|_________|',
  '   |(_)---  |   H\\________/ |   |        =|___ ___|  ',
  '   /     |  |   H  |  |     |   |         ||_| |_||  ',
  '  |      |  |   H  |__--------------------| [___] |  ',
  '  | ________|___H__/__|_____/[][]~\\_______|       |  ',
  '  |/ |   |-----------I_____I [][] []  D   |=======|__',
];

/*
 * The wheels and coupling rods, cycled frame to frame. This is the only part
 * that animates in the original, and it is what stops the thing reading as a
 * picture being dragged sideways.
 */
const WHEELS = [
  [
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
    ' |/-=|___|=    ||    ||    ||    |_____/~\\___/      ',
    "  \\_/      \\O=====O=====O=====O_/      \\_/          ",
  ],
  [
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
    ' |/-=|___|=O=====O=====O=====O   |_____/~\\___/      ',
    '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/          ',
  ],
  [
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
    ' |/-=|___|=   O=====O=====O=====O|_____/~\\___/      ',
    '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/          ',
  ],
];

const ART_WIDTH = Math.max(...BODY.map((line) => line.length));
const STEP = 3;
const FRAME_MS = 45;

/** Slide the art to `offset` columns from the left edge, clipped to the log. */
function frameAt(art: string[], offset: number, columns: number): string {
  return art
    .map((line) => {
      const shifted = offset >= 0 ? ' '.repeat(offset) + line : line.slice(-offset);
      return shifted.slice(0, columns);
    })
    .join('\n');
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  name: 'sl',
  usage: 'sl',
  summary: 'you typed it wrong',
  order: 99,
  hidden: true,
  async run(_arg, ctx) {
    const columns = ctx.columns();
    const drawing = ctx.draw();

    /*
     * Reduced motion gets the train standing still rather than nothing at all:
     * the joke survives, the movement does not. It stays on screen instead of
     * being cleared, since there was no animation to leave behind.
     */
    if (ctx.reducedMotion()) {
      drawing.update([...BODY, ...WHEELS[0]].join('\n'));
      return;
    }

    try {
      for (let offset = columns; offset > -ART_WIDTH; offset -= STEP) {
        const wheels = WHEELS[Math.abs(Math.floor(offset / STEP)) % WHEELS.length];
        drawing.update(frameAt([...BODY, ...wheels], offset, columns));
        await sleep(FRAME_MS);
      }
    } finally {
      // Once it has passed, it has passed. The scrollback keeps the prompt and
      // nothing else, which is exactly what you get for mistyping `ls`.
      drawing.end();
    }
  },
} satisfies Command;
