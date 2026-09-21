import type { Command } from '../types';

const BODY = [
  '      ====        ________                ___________',
  '  _D _|  |_______/        \\__I_I_____===__|_________|',
  '   |(_)---  |   H\\________/ |   |        =|___ ___|  ',
  '   /     |  |   H  |  |     |   |         ||_| |_||  ',
  '  |      |  |   H  |__--------------------| [___] |  ',
  '  | ________|___H__/__|_____/[][]~\\_______|       |  ',
  '  |/ |   |-----------I_____I [][] []  D   |=======|__',
];

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
      drawing.end();
    }
  },
} satisfies Command;
