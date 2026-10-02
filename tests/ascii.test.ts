import { describe, expect, it } from 'vitest';
import { asciiRows } from '../src/lib/ascii';

describe('ascii rows', () => {
  const rows = asciiRows();

  it('covers 0 to 127 in order', () => {
    expect(rows.map((row) => row.code)).toEqual(Array.from({ length: 128 }, (_, code) => code));
  });

  it('gives hex, binary and the character', () => {
    expect(rows[65]).toEqual({ code: 65, hex: '41', bin: '01000001', glyph: 'A', control: false });
    expect(rows[10].hex).toBe('0A');
    expect(rows[126].glyph).toBe('~');
  });

  it('names what cannot be seen', () => {
    expect([0, 10, 32, 127].map((code) => rows[code].glyph)).toEqual(['NUL', 'LF', 'SP', 'DEL']);
    expect(rows[31].glyph).toBe('US');
  });

  it('flags control characters only', () => {
    const control = rows.filter((row) => row.control).map((row) => row.code);
    expect(control).toEqual([...Array.from({ length: 32 }, (_, code) => code), 127]);
  });
});
