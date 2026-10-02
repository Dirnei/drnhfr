import { describe, expect, it } from 'vitest';
import { createCtf, type PublicCtf } from '../src/lib/ctf/doors';
import { parseProgress, sessionStore, type CtfProgress, type ProgressStore } from '../src/lib/ctf/session';
import { newSalt, sealPayload } from '../scripts/ctf/seal-crypto.mjs';

const ITERATIONS = 1000;
const salt = newSalt();
const both = (text: string) => ({ de: text, en: text });
const flagOf = (door: string) => `drnhfr{${door}-is-the-door-here}`;
const DOORS = ['site', 'homelab', 'laser'];

const payload = (door: string, last = false) => ({
  title: both(door),
  html: both(`<p>${door}</p>`),
  hints: last ? null : [both(`after ${door} 1`), both(`after ${door} 2`)],
  terminal: { files: [], hosts: [] },
  downloads: [],
});

const pub: PublicCtf = {
  salt,
  iterations: ITERATIONS,
  doors: DOORS,
  entry: '',
  hints: [both('entry 1'), both('entry 2')],
};
const sealed = Object.fromEntries(
  DOORS.map((door, index) => [door, sealPayload(payload(door, index === DOORS.length - 1), flagOf(door), salt, ITERATIONS)]),
);

function memoryStore(initial?: CtfProgress): ProgressStore & { saved: CtfProgress | null } {
  let saved: CtfProgress | null = initial ?? null;
  return {
    get saved() {
      return saved;
    },
    read: () => structuredClone(saved ?? { keys: {}, hints: {} }),
    write(progress) {
      saved = structuredClone(progress);
      return true;
    },
  };
}

describe('submit', () => {
  it('opens the door the flag belongs to and records it', async () => {
    const store = memoryStore();
    const ctf = createCtf(pub, sealed, store);
    let changes = 0;
    ctf.onChange(() => changes++);
    expect(await ctf.submit(`  ${flagOf('site')}\n`)).toEqual({ kind: 'opened', door: 'site', persisted: true });
    expect(ctf.opened().map((entry) => entry.door)).toEqual(['site']);
    expect(Object.keys(store.saved!.keys)).toEqual(['site']);
    expect(changes).toBe(1);
  });

  it('accepts a flag without the drnhfr{...} wrapper', async () => {
    const ctf = createCtf(pub, sealed, memoryStore());
    expect(await ctf.submit(' site-is-the-door-here ')).toMatchObject({ kind: 'opened', door: 'site' });
  });

  it('rejects a wrong flag and records nothing', async () => {
    const store = memoryStore();
    const ctf = createCtf(pub, sealed, store);
    expect(await ctf.submit('drnhfr{not-a-flag-of-this-game}')).toEqual({ kind: 'wrong' });
    expect(store.saved).toBeNull();
  });

  it('is case sensitive', async () => {
    const ctf = createCtf(pub, sealed, memoryStore());
    expect(await ctf.submit(flagOf('site').toUpperCase())).toEqual({ kind: 'wrong' });
  });

  it('names the door an already used flag opened', async () => {
    const ctf = createCtf(pub, sealed, memoryStore());
    await ctf.submit(flagOf('homelab'));
    expect(await ctf.submit(flagOf('homelab'))).toEqual({ kind: 'already', door: 'homelab' });
  });

  it('opens doors out of order', async () => {
    const ctf = createCtf(pub, sealed, memoryStore());
    expect(await ctf.submit(flagOf('laser'))).toMatchObject({ kind: 'opened', door: 'laser' });
    expect(await ctf.submit(flagOf('site'))).toMatchObject({ kind: 'opened', door: 'site' });
    expect(ctf.opened().map((entry) => entry.door)).toEqual(['site', 'laser']);
  });

  it('still opens the door when storage refuses the write', async () => {
    const store: ProgressStore = { read: () => ({ keys: {}, hints: {} }), write: () => false };
    const ctf = createCtf(pub, sealed, store);
    expect(await ctf.submit(flagOf('site'))).toEqual({ kind: 'opened', door: 'site', persisted: false });
    expect(ctf.payload('site')?.html.de).toBe('<p>site</p>');
  });
});

describe('restore', () => {
  it('reopens stored doors without the flag', async () => {
    const store = memoryStore();
    await createCtf(pub, sealed, store).submit(flagOf('homelab'));
    const next = createCtf(pub, sealed, store);
    await next.restore();
    expect(next.opened().map((entry) => entry.door)).toEqual(['homelab']);
  });

  it('ignores a stored key that does not fit', async () => {
    const ctf = createCtf(pub, sealed, memoryStore({ keys: { site: 'AAAA' }, hints: {} }));
    await ctf.restore();
    expect(ctf.opened()).toEqual([]);
  });
});

describe('hint', () => {
  it('starts with the public hints for the first door and escalates', async () => {
    const ctf = createCtf(pub, sealed, memoryStore());
    expect(ctf.hint()).toEqual({ kind: 'hint', door: 'site', text: both('entry 1') });
    expect(ctf.hint()).toEqual({ kind: 'hint', door: 'site', text: both('entry 2') });
    expect(ctf.hint()).toEqual({ kind: 'hint', door: 'site', text: both('entry 2') });
  });

  it('takes the next door hints from the previous door', async () => {
    const ctf = createCtf(pub, sealed, memoryStore());
    await ctf.submit(flagOf('site'));
    expect(ctf.hint()).toEqual({ kind: 'hint', door: 'homelab', text: both('after site 1') });
  });

  it('says when everything is solved', async () => {
    const ctf = createCtf(pub, sealed, memoryStore());
    for (const door of DOORS) await ctf.submit(flagOf(door));
    expect(ctf.hint()).toEqual({ kind: 'done' });
  });
});

describe('session store', () => {
  it('round trips through sessionStorage', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    } as Storage;
    const store = sessionStore(() => storage);
    expect(store.write({ keys: { site: 'abc' }, hints: { site: 1 } })).toBe(true);
    expect(store.read()).toEqual({ keys: { site: 'abc' }, hints: { site: 1 } });
  });

  it('survives storage that throws', () => {
    const store = sessionStore(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(store.read()).toEqual({ keys: {}, hints: {} });
    expect(store.write({ keys: {}, hints: {} })).toBe(false);
  });

  it('treats garbage as empty', () => {
    expect(parseProgress('{nope')).toEqual({ keys: {}, hints: {} });
  });
});
