import { describe, expect, it } from 'vitest';
import { readingTimeMinutes } from '../src/lib/reading-time';

describe('readingTimeMinutes', () => {
  it('returns at least one minute for short text', () => {
    expect(readingTimeMinutes('Ein Satz.')).toBe(1);
  });

  it('rounds up to whole minutes at 200 words per minute', () => {
    const words = new Array(450).fill('wort').join(' ');
    expect(readingTimeMinutes(words)).toBe(3);
  });

  it('ignores fenced code blocks when counting', () => {
    const prose = new Array(200).fill('wort').join(' ');
    const code = '```ts\n' + new Array(600).fill('const x = 1;').join('\n') + '\n```';
    expect(readingTimeMinutes(`${prose}\n\n${code}`)).toBe(1);
  });
});
