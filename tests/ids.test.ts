import { describe, expect, it } from 'vitest';
import { langOf, slugOf } from '../src/lib/ids';

describe('langOf', () => {
  it('reads the language from the directory prefix', () => {
    expect(langOf('de/split-brain')).toBe('de');
    expect(langOf('en/split-brain')).toBe('en');
  });

  it('falls back to the default locale for an unprefixed id', () => {
    expect(langOf('split-brain')).toBe('de');
  });
});

describe('slugOf', () => {
  it('strips the language prefix', () => {
    expect(slugOf('de/split-brain')).toBe('split-brain');
  });

  it('keeps nested paths below the language directory', () => {
    expect(slugOf('en/2026/split-brain')).toBe('2026/split-brain');
  });
});
