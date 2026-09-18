import { describe, expect, it } from 'vitest';
import { findCounterpart } from '../src/lib/translations';

const entries = [
  { id: 'en/split-brain', data: { translationKey: 'split-brain' } },
  { id: 'en/event-sourcing', data: { translationKey: 'event-sourcing' } },
];

describe('findCounterpart', () => {
  it('finds the entry with the matching translation key', () => {
    expect(findCounterpart(entries, 'split-brain')?.id).toBe('en/split-brain');
  });

  it('returns undefined when no counterpart exists', () => {
    expect(findCounterpart(entries, 'k3s-homelab')).toBeUndefined();
  });
});
