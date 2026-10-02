import { deriveKey, fromBase64, hasWebCrypto, openDoor, toBase64, type Sealed } from './crypto';
import type { ProgressStore } from './session';

export type Localised = { de: string; en: string };

export interface CtfFile {
  name: string;
  content: string;
}

export interface CtfHost {
  host: string;
  status?: number;
  error?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface DoorPayload {
  title: Localised;
  html: Localised;
  hints: Localised[] | null;
  terminal: { files: CtfFile[]; hosts: CtfHost[] };
  downloads: CtfFile[];
}

export interface PublicCtf {
  salt: string;
  iterations: number;
  doors: string[];
  entry: string;
  hints: Localised[];
}

export type SubmitResult =
  | { kind: 'opened'; door: string; persisted: boolean }
  | { kind: 'already'; door: string }
  | { kind: 'wrong' }
  | { kind: 'unsupported' };

export type HintResult = { kind: 'hint'; door: string; text: Localised } | { kind: 'done' };

export interface Ctf {
  readonly doors: readonly string[];
  restore(): Promise<void>;
  submit(flag: string): Promise<SubmitResult>;
  hint(): HintResult;
  opened(): Array<{ door: string; payload: DoorPayload }>;
  payload(door: string): DoorPayload | undefined;
  onChange(listener: () => void): void;
  started(): boolean;
  start(now: number): void;
  elapsed(now: number): number | null;
  finishedIn(): number | null;
}

export function normaliseFlag(raw: string): string {
  const flag = raw.trim();
  return /^drnhfr\{.*\}$/.test(flag) ? flag : `drnhfr{${flag}}`;
}

export function createCtf(
  pub: PublicCtf,
  sealed: Record<string, Sealed>,
  store: ProgressStore,
  now: () => number = Date.now,
): Ctf {
  const open = new Map<string, DoorPayload>();
  const listeners: Array<() => void> = [];
  const progress = store.read();
  const changed = () => listeners.forEach((listener) => listener());

  const tryKey = async (door: string, key: Uint8Array) => {
    const box = sealed[door];
    if (!box) return null;
    return openDoor<DoorPayload>(key, box);
  };

  return {
    doors: pub.doors,

    async restore() {
      if (!hasWebCrypto()) return;
      for (const door of pub.doors) {
        const stored = progress.keys[door];
        if (!stored || open.has(door)) continue;
        const payload = await tryKey(door, fromBase64(stored));
        if (payload) open.set(door, payload);
      }
      if (open.size > 0) changed();
    },

    async submit(raw) {
      if (!hasWebCrypto()) return { kind: 'unsupported' };
      const flag = normaliseFlag(raw);
      const key = await deriveKey(flag, pub.salt, pub.iterations);
      for (const door of pub.doors) {
        if (open.has(door)) {
          if (progress.keys[door] === toBase64(key)) return { kind: 'already', door };
          continue;
        }
        const payload = await tryKey(door, key);
        if (!payload) continue;
        open.set(door, payload);
        progress.keys[door] = toBase64(key);
        if (open.size === pub.doors.length && progress.startedAt !== undefined) {
          progress.finishedAt ??= now();
        }
        const persisted = store.write(progress);
        changed();
        return { kind: 'opened', door, persisted };
      }
      return { kind: 'wrong' };
    },

    hint() {
      const index = pub.doors.findIndex((door) => !open.has(door));
      if (index === -1) return { kind: 'done' };
      const door = pub.doors[index];
      const hints = index === 0 ? pub.hints : (open.get(pub.doors[index - 1])?.hints ?? null);
      if (!hints || hints.length === 0) return { kind: 'done' };
      const level = Math.min(progress.hints[door] ?? 0, hints.length - 1);
      progress.hints[door] = level + 1;
      store.write(progress);
      return { kind: 'hint', door, text: hints[level] };
    },

    opened() {
      return pub.doors.filter((door) => open.has(door)).map((door) => ({ door, payload: open.get(door)! }));
    },

    payload(door) {
      return open.get(door);
    },

    onChange(listener) {
      listeners.push(listener);
    },

    started() {
      return progress.startedAt !== undefined;
    },

    start(at) {
      if (progress.startedAt !== undefined) return;
      progress.startedAt = at;
      store.write(progress);
      changed();
    },

    elapsed(at) {
      if (progress.startedAt === undefined) return null;
      return (progress.finishedAt ?? at) - progress.startedAt;
    },

    finishedIn() {
      if (progress.startedAt === undefined || progress.finishedAt === undefined) return null;
      return progress.finishedAt - progress.startedAt;
    },
  };
}
