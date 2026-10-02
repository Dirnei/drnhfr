import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { SealError } from './seal.mjs';

const run = promisify(execFile);

export async function sopsDecrypt(file, sops = process.env.SOPS_BIN ?? 'sops') {
  try {
    const { stdout } = await run(sops, ['-d', '--output-type', 'json', file], {
      maxBuffer: 16 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new SealError(
        'sops is not installed or not on PATH (winget install SecretsOPerationS.SOPS, or set SOPS_BIN)',
      );
    }
    const stderr = String(error.stderr ?? error.message);
    if (/data key|no identity|age key|could not decrypt/i.test(stderr)) {
      throw new SealError(
        `no age key can decrypt ${file}. Expected it in %AppData%\\sops\\age\\keys.txt or SOPS_AGE_KEY_FILE; restore it from 1Password`,
      );
    }
    throw new SealError(`sops failed on ${file}: ${stderr.trim()}`);
  }
}
