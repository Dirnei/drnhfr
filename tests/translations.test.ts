import { describe, expect, it } from 'vitest';
import { findCounterpart } from '../src/lib/translations';

const entries = [{ id: 'split-brain.en' }, { id: 'event-sourcing.en' }];

describe('findCounterpart', () => {
  it('finds the entry whose slug matches', () => {
    expect(findCounterpart(entries, 'split-brain')?.id).toBe('split-brain.en');
  });

  it('returns undefined when no counterpart exists', () => {
    expect(findCounterpart(entries, 'k3s-homelab')).toBeUndefined();
  });
});
