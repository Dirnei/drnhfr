import { mkdtemp, readdir, rename, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ITERATIONS, newSalt, sealPayload } from './seal-crypto.mjs';

export class SealError extends Error {}

const FLAG = /^drnhfr\{[^{}]{16,}\}$/;
const PLACEHOLDER = /^\s*(PLATZHALTER|PLACEHOLDER):/;
const LANGS = ['de', 'en'];
const ENTRY = /^0-entry\.sops\.yaml$/;
const DOOR = /^(\d+)-([a-z0-9-]+)\.sops\.yaml$/;

export async function listDoorFiles(doorsDir) {
  const names = await readdir(doorsDir);
  const entry = names.find((name) => ENTRY.test(name));
  if (!entry) throw new SealError(`missing ${doorsDir}/0-entry.sops.yaml`);
  const doors = names
    .map((name) => ({ name, match: DOOR.exec(name) }))
    .filter(({ match }) => match && match[1] !== '0')
    .map(({ name, match }) => ({ file: name, order: Number(match[1]), id: match[2] }))
    .sort((a, b) => a.order - b.order);
  if (doors.length === 0) throw new SealError(`no doors in ${doorsDir}`);
  return { entry, doors };
}

function requireLocalised(door, field, value) {
  for (const lang of LANGS) {
    if (typeof value?.[lang] !== 'string' || !value[lang].trim()) {
      throw new SealError(`${door}: ${field}.${lang} is missing`);
    }
  }
}

function requireHints(owner, hints) {
  if (!Array.isArray(hints) || hints.length < 1 || hints.length > 2) {
    throw new SealError(`${owner}: hints must list one or two hints for the next door`);
  }
  for (const hint of hints) requireLocalised(owner, 'hints[]', hint);
}

export function validateDoor(id, door, isLast) {
  if (typeof door.flag !== 'string' || !FLAG.test(door.flag)) {
    throw new SealError(`${id}: flag must look like drnhfr{...} with at least 16 characters inside`);
  }
  requireLocalised(id, 'title', door.title);
  requireLocalised(id, 'story', door.story);
  if (isLast) {
    if (door.hints) throw new SealError(`${id}: the last door has no next door to hint at`);
  } else {
    requireHints(id, door.hints);
  }
  for (const file of door.terminal?.files ?? []) {
    if (!/^\.[\w.-]+$/.test(file.name ?? '')) throw new SealError(`${id}: terminal file names start with a dot`);
    if (typeof file.content !== 'string') throw new SealError(`${id}: terminal file ${file.name} has no content`);
  }
  for (const host of door.terminal?.hosts ?? []) {
    if (typeof host.host !== 'string' || (typeof host.status !== 'number') === (typeof host.error !== 'string')) {
      throw new SealError(`${id}: every terminal host needs host and either status or error`);
    }
  }
  for (const download of door.downloads ?? []) {
    if (typeof download.name !== 'string' || typeof download.content !== 'string') {
      throw new SealError(`${id}: every download needs name and content`);
    }
  }
}

export async function seal({ doorsDir, outDir, decrypt, render, warn = console.warn, iterations = ITERATIONS }) {
  const { entry, doors } = await listDoorFiles(doorsDir);

  const entryData = await decrypt(join(doorsDir, entry));
  requireHints('entry', entryData.hints);

  const loaded = [];
  for (const [index, door] of doors.entries()) {
    const data = await decrypt(join(doorsDir, door.file));
    validateDoor(door.id, data, index === doors.length - 1);
    loaded.push({ ...door, data });
  }
  const flags = new Set(loaded.map((door) => door.data.flag));
  if (flags.size !== loaded.length) throw new SealError('two doors share a flag');

  const salt = newSalt();
  const sealed = {};
  for (const { id, data } of loaded) {
    const html = {};
    for (const lang of LANGS) {
      if (PLACEHOLDER.test(data.story[lang])) warn(`${id}: story.${lang} is still a placeholder`);
      html[lang] = await render(data.story[lang]);
    }
    const payload = {
      title: data.title,
      html,
      hints: data.hints ?? null,
      terminal: { files: data.terminal?.files ?? [], hosts: data.terminal?.hosts ?? [] },
      downloads: data.downloads ?? [],
    };
    sealed[id] = sealPayload(payload, data.flag, salt, iterations);
  }

  const publicData = {
    salt,
    iterations,
    doors: loaded.map(({ id }) => id),
    entry: Buffer.from(loaded[0].data.flag, 'utf8').toString('base64'),
    hints: entryData.hints,
  };

  await mkdir(outDir, { recursive: true });
  const staging = await mkdtemp(join(outDir, '.staging-'));
  try {
    await writeFile(join(staging, 'public.json'), JSON.stringify(publicData, null, 2) + '\n');
    for (const [id, value] of Object.entries(sealed)) {
      await writeFile(join(staging, `${id}.sealed.json`), JSON.stringify(value, null, 2) + '\n');
    }
    for (const name of await readdir(outDir)) {
      if (name.endsWith('.sealed.json')) await rm(join(outDir, name));
    }
    for (const name of await readdir(staging)) {
      await rename(join(staging, name), join(outDir, name));
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return publicData;
}
