import { describe, expect, it } from 'vitest';
import { deriveKey, openDoor } from '../src/lib/ctf/crypto';
import { newSalt, sealPayload } from '../scripts/ctf/seal-crypto.mjs';

const ITERATIONS = 1000;

describe('door crypto', () => {
  const salt = newSalt();
  const flag = 'drnhfr{correct-horse-battery}';
  const sealed = sealPayload({ hello: 'welt' }, flag, salt, ITERATIONS);

  it('opens a door sealed in node with the right flag', async () => {
    const key = await deriveKey(flag, salt, ITERATIONS);
    expect(await openDoor(key, sealed)).toEqual({ hello: 'welt' });
  });

  it('rejects a wrong flag', async () => {
    const key = await deriveKey('drnhfr{wrong-horse-battery}', salt, ITERATIONS);
    expect(await openDoor(key, sealed)).toBeNull();
  });

  it('rejects the right flag under a different salt', async () => {
    const key = await deriveKey(flag, newSalt(), ITERATIONS);
    expect(await openDoor(key, sealed)).toBeNull();
  });
});
