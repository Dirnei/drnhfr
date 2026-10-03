import { STATE_KEY } from './unlock';

export interface SavedLine {
  kind: string;
  text: string;
}

export interface TerminalState {
  open: boolean;
  focused: boolean;
  failed: boolean;
  motd: boolean;
  history: string[];
  lines: SavedLine[];
  height: number | null;
}

export const MAX_SAVED_LINES = 400;
export const MAX_SAVED_HISTORY = 100;

export function trimState(state: TerminalState): TerminalState {
  return {
    ...state,
    history: state.history.slice(-MAX_SAVED_HISTORY),
    lines: state.lines.slice(-MAX_SAVED_LINES),
  };
}

export function parseState(raw: string | null): TerminalState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<TerminalState>;
    if (!Array.isArray(value.lines) || !Array.isArray(value.history)) return null;
    return {
      open: value.open === true,
      focused: value.focused === true,
      failed: value.failed === true,
      motd: value.motd !== false,
      height: typeof value.height === 'number' && value.height > 0 ? value.height : null,
      history: value.history.filter((entry): entry is string => typeof entry === 'string'),
      lines: value.lines.filter(
        (line): line is SavedLine =>
          typeof line?.kind === 'string' && typeof line?.text === 'string',
      ),
    };
  } catch {
    return null;
  }
}

export function readState(): TerminalState | null {
  try {
    return parseState(sessionStorage.getItem(STATE_KEY));
  } catch {
    return null;
  }
}

export function writeState(state: TerminalState): void {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(trimState(state)));
  } catch {
    // Storage blocked or full: the next page starts with an empty terminal.
  }
}
