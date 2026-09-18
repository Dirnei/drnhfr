import { describe, expect, it } from 'vitest';
import { formatDate } from '../src/lib/format';

describe('formatDate', () => {
  const date = new Date('2026-09-02T00:00:00Z');

  it('formats German dates', () => {
    expect(formatDate(date, 'de')).toBe('2. September 2026');
  });

  it('formats English dates', () => {
    expect(formatDate(date, 'en')).toBe('2 September 2026');
  });
});
