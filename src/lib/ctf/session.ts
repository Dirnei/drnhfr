export const CTF_KEY = 'ctf';

export interface CtfProgress {
  keys: Record<string, string>;
  hints: Record<string, number>;
}

export interface ProgressStore {
  read(): CtfProgress;
  write(progress: CtfProgress): boolean;
}

const empty = (): CtfProgress => ({ keys: {}, hints: {} });

export function parseProgress(raw: string | null): CtfProgress {
  if (!raw) return empty();
  try {
    const value = JSON.parse(raw) as Partial<CtfProgress>;
    return {
      keys: typeof value.keys === 'object' && value.keys ? value.keys : {},
      hints: typeof value.hints === 'object' && value.hints ? value.hints : {},
    };
  } catch {
    return empty();
  }
}

export function sessionStore(storage: () => Storage = () => sessionStorage): ProgressStore {
  return {
    read() {
      try {
        return parseProgress(storage().getItem(CTF_KEY));
      } catch {
        return empty();
      }
    },
    write(progress) {
      try {
        storage().setItem(CTF_KEY, JSON.stringify(progress));
        return true;
      } catch {
        return false;
      }
    },
  };
}
