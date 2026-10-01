import { describe, expect, it } from 'vitest';
import { padTag, rollLineStepMs, tagWidth } from '../src/lib/terminal/boot-log';
import bootData from '../src/data/boot.json';

describe('boot log tags', () => {
  it('sizes the tag column for the longest tag plus a space either side', () => {
    expect(tagWidth([{ text: '$ boot' }, { tag: 'OK', text: 'a' }, { tag: 'WAIT', text: 'b' }])).toBe(6);
    expect(tagWidth([{ text: '$ boot' }])).toBe(0);
  });

  it('centres every tag in a column of equal width', () => {
    const width = tagWidth(bootData.lines);
    const rendered = bootData.lines.flatMap((line) => (line.tag ? [padTag(line.tag, width)] : []));
    expect(new Set(rendered.map((tag) => tag.length)).size).toBe(1);
    expect(padTag('OK', 6)).toBe('[  OK  ]');
    expect(padTag('INFO', 6)).toBe('[ INFO ]');
  });
});

describe('rollLineStepMs', () => {
  it('always lands within [minMs, maxMs]', () => {
    for (let i = 0; i < 1000; i++) {
      const value = rollLineStepMs(120, 340);
      expect(value).toBeGreaterThanOrEqual(120);
      expect(value).toBeLessThanOrEqual(340);
    }
  });
});
