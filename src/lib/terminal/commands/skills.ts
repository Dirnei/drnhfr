import type { Command } from '../types';

const BAR_WIDTH = 10;
const FULL_INK = '█';
const EMPTY_INK = '░';

/** cv.json stores a plain string when both languages say the same thing. */
function pickEn(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'en' in value) {
    return String((value as { en: unknown }).en);
  }
  return '';
}

export function bar(level: number, full = FULL_INK, empty = EMPTY_INK): string {
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round(level / 10)));
  return full.repeat(filled) + empty.repeat(BAR_WIDTH - filled);
}

export default {
  name: 'skills',
  usage: 'skills',
  summary: 'what I work with, one per line, made for pipes',
  order: 7,
  async run(arg, ctx) {
    if (arg.trim()) {
      ctx.printError('skills: takes no arguments, try: skills | grep -i devops');
      return;
    }
    const cv = (await import('../../../data/cv.json')).default;
    const rows = cv.expertise.flatMap((group) =>
      group.skills.map((skill) => ({
        level: skill.level,
        name: pickEn(skill.name),
        group: pickEn(group.group),
      })),
    );

    const reference = ctx.charWidth('M'.repeat(20));
    const cellPerfect =
      reference > 0 && Math.abs(ctx.charWidth(FULL_INK.repeat(20)) - reference) < 0.05;
    const [full, empty] = cellPerfect ? [FULL_INK, EMPTY_INK] : ['#', '-'];

    const nameWidth = Math.max(...rows.map((row) => row.name.length));
    const withGroup = 3 + 2 + BAR_WIDTH + 2 + nameWidth + 2 + 12 <= ctx.columns();
    const lines = rows.map((row) => {
      const line = `${String(row.level).padStart(3)}  ${bar(row.level, full, empty)}  ${row.name}`;
      return withGroup ? `${line.padEnd(3 + 2 + BAR_WIDTH + 2 + nameWidth)}  ${row.group}` : line;
    });
    ctx.print(lines.join('\n'));
  },
} satisfies Command;
