import type { Command } from '../types';

const COW = [
  '        \\   ^__^',
  '         \\  (oo)\\_______',
  '            (__)\\       )\\/\\',
  '                ||----w |',
  '                ||     ||',
];

const WRAP_AT = 40;

/** Greedy wrap. Words longer than the limit are left alone rather than cut. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!current) current = word;
    else if (current.length + 1 + word.length <= width) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function bubble(text: string, width: number): string[] {
  const lines = wrap(text, width);
  const inner = Math.max(...lines.map((line) => line.length));
  const top = ` ${'_'.repeat(inner + 2)}`;
  const bottom = ` ${'-'.repeat(inner + 2)}`;

  if (lines.length === 1) {
    return [top, `< ${lines[0].padEnd(inner)} >`, bottom];
  }
  const body = lines.map((line, index) => {
    const [left, right] =
      index === 0 ? ['/', '\\'] : index === lines.length - 1 ? ['\\', '/'] : ['|', '|'];
    return `${left} ${line.padEnd(inner)} ${right}`;
  });
  return [top, ...body, bottom];
}

export default {
  name: 'cowsay',
  usage: 'cowsay <text>',
  summary: 'ask the cow to say something',
  order: 16,
  run(arg, ctx) {
    const said = arg.trim() || 'moo';
    // Never wrap wider than the log, or the bubble folds and stops being one.
    const width = Math.max(12, Math.min(WRAP_AT, ctx.columns() - 6));
    ctx.printArt([...bubble(said, width), ...COW].join('\n'));
  },
} satisfies Command;
