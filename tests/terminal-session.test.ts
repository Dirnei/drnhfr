import { describe, expect, it } from 'vitest';
import { MAX_SAVED_LINES, parseState, trimState } from '../src/lib/terminal/session';

const base = { open: true, focused: false, failed: false, motd: true, history: ['ls'], lines: [], height: 320 };

describe('terminal session state', () => {
  it('round-trips through JSON', () => {
    const state = { ...base, lines: [{ kind: 'echo', text: 'ls' }, { kind: 'out', text: 'projekte/' }] };
    expect(parseState(JSON.stringify(state))).toEqual(state);
  });

  it('rejects missing or malformed state', () => {
    expect(parseState(null)).toBeNull();
    expect(parseState('{')).toBeNull();
    expect(parseState('{"open":true}')).toBeNull();
  });

  it('drops lines that are not kind and text strings', () => {
    const raw = JSON.stringify({ ...base, lines: [{ kind: 'out', text: 'a' }, { kind: 1 }, null] });
    expect(parseState(raw)?.lines).toEqual([{ kind: 'out', text: 'a' }]);
  });

  it('keeps only the newest lines', () => {
    const lines = Array.from({ length: MAX_SAVED_LINES + 5 }, (_, index) => ({ kind: 'out', text: String(index) }));
    const trimmed = trimState({ ...base, lines });
    expect(trimmed.lines).toHaveLength(MAX_SAVED_LINES);
    expect(trimmed.lines[0].text).toBe('5');
  });
});
