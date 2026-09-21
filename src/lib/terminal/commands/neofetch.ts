import { copy } from '../copy';
import { humanise, humaniseCoarse } from '../duration';
import type { Command } from '../types';

const LOGO = [
  ' ============ ',
  ' |          | ',
  ' |   D R N  | ',
  ' |   H F R  | ',
  ' |          | ',
  ' ============ ',
];

/** cv.json stores a plain string when both languages say the same thing. */
function pickEn(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'en' in value) {
    return String((value as { en: unknown }).en);
  }
  return '';
}

export default {
  name: 'neofetch',
  usage: 'neofetch',
  summary: 'who and what this is',
  order: 14,
  async run(_arg, ctx) {
    const cv = (await import('../../../data/cv.json')).default;
    const current = cv.experience[0];

    const commitAge = (() => {
      const { lastCommit } = ctx.config;
      if (!lastCommit) return null;
      const age = Date.now() - new Date(lastCommit).getTime();
      return Number.isNaN(age) || age < 0 ? null : age;
    })();

    const rows: Array<[string, string]> = [
      ['Role', pickEn(cv.profile.title)],
      ['Stack', current.stack.slice(0, 5).join(' · ')],
      ['Where', pickEn(cv.profile.location)],
      ['Shell', 'drnhfr-sh'],
      ['Commands', `${ctx.commands().filter((command) => !command.hidden).length} installed`],
      ['Uptime', humanise(ctx.uptimeMs())],
      ...(commitAge === null
        ? []
        : ([['Updated', `${humaniseCoarse(commitAge)} ago`]] as Array<[string, string]>)),
      ['CV', ctx.isUnlocked() ? 'unlocked' : 'locked, try su'],
    ];

    const user = ctx.isUnlocked() ? copy.promptUserRoot : copy.promptUser;
    const labelWidth = Math.max(...rows.map(([label]) => label.length));
    const facts = [
      user,
      '-'.repeat(user.length),
      ...rows.map(([label, value]) => `${(label + ':').padEnd(labelWidth + 2)}${value}`),
    ];

    const height = Math.max(LOGO.length, facts.length);
    const logoWidth = Math.max(...LOGO.map((line) => line.length));
    const lines: string[] = [];
    for (let row = 0; row < height; row += 1) {
      const left = (LOGO[row] ?? '').padEnd(logoWidth);
      const right = facts[row] ?? '';
      lines.push(`${left}  ${right}`.replace(/\s+$/, ''));
    }
    lines.push('', copy.whoami);
    ctx.printArt(lines.join('\n'));
  },
} satisfies Command;
