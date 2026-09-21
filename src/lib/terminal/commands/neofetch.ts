import { copy } from '../copy';
import type { Command } from '../types';

/*
 * The mark, in characters that cannot be substituted. Not block glyphs: this
 * one has to survive whatever font the visitor ends up with, and a sheared
 * logo is worse than a plain one. See font.ts for the longer version of that
 * argument.
 */
const LOGO = [
  ' ============ ',
  ' |          | ',
  ' |   D R N  | ',
  ' |   H F R  | ',
  ' |          | ',
  ' ============ ',
];

/** "4m 12s" — same shape as the uptime command prints. */
function humanise(ms: number): string {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

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
  order: 13,
  async run(_arg, ctx) {
    /*
     * Read from cv.json rather than repeating the facts here. It is the same
     * source the CV page renders from, so the role and the location cannot
     * drift apart — and it is fetched lazily, so the home page does not carry
     * the CV around for the sake of one command.
     *
     * The raw JSON, not data/cv.ts: that module pulls in zod to validate, and
     * this only needs three fields it can read for itself.
     */
    const cv = (await import('../../../data/cv.json')).default;
    const current = cv.experience[0];

    const rows: Array<[string, string]> = [
      ['Role', pickEn(cv.profile.title)],
      ['Stack', current.stack.slice(0, 5).join(' · ')],
      ['Where', pickEn(cv.profile.location)],
      ['Shell', 'drnhfr-sh'],
      ['Commands', `${ctx.commands().filter((command) => !command.hidden).length} installed`],
      ['Uptime', humanise(ctx.uptimeMs())],
      ['CV', ctx.isUnlocked() ? 'unlocked' : 'locked — try su'],
    ];

    const user = ctx.isUnlocked() ? copy.promptUserRoot : copy.promptUser;
    const labelWidth = Math.max(...rows.map(([label]) => label.length));
    const facts = [
      user,
      '-'.repeat(user.length),
      ...rows.map(([label, value]) => `${(label + ':').padEnd(labelWidth + 2)}${value}`),
    ];

    // Two columns, padded to whichever side is taller.
    const height = Math.max(LOGO.length, facts.length);
    const logoWidth = Math.max(...LOGO.map((line) => line.length));
    const lines: string[] = [];
    for (let row = 0; row < height; row += 1) {
      const left = (LOGO[row] ?? '').padEnd(logoWidth);
      const right = facts[row] ?? '';
      lines.push(`${left}  ${right}`.replace(/\s+$/, ''));
    }
    ctx.printArt(lines.join('\n'));
  },
} satisfies Command;
