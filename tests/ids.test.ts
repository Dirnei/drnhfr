import { describe, expect, it } from 'vitest';
import { langOf, slugOf } from '../src/lib/ids';

describe('langOf', () => {
  it('reads the language from the filename suffix', () => {
    expect(langOf('split-brain.de')).toBe('de');
    expect(langOf('split-brain.en')).toBe('en');
  });

  it('falls back to the default locale for an unsuffixed id', () => {
    expect(langOf('split-brain')).toBe('de');
  });

  it('ignores a suffix that is not a locale', () => {
    expect(langOf('split-brain.fr')).toBe('de');
  });
});

describe('slugOf', () => {
  it('strips the language suffix', () => {
    expect(slugOf('split-brain.de')).toBe('split-brain');
  });

  it('keeps an id that carries no language suffix', () => {
    expect(slugOf('split-brain')).toBe('split-brain');
    expect(slugOf('split-brain.fr')).toBe('split-brain.fr');
  });

  it('only strips the last segment', () => {
    expect(slugOf('v1.2.en')).toBe('v1.2');
  });
});
