import { fileURLToPath } from 'node:url';
import { satteri } from '@astrojs/markdown-satteri';
import { SealError, seal } from './ctf/seal.mjs';
import { sopsDecrypt } from './ctf/sops.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

const renderer = await satteri().createRenderer({
  shikiConfig: { theme: 'github-dark-default', wrap: true },
});

try {
  const result = await seal({
    doorsDir: `${root}ctf/doors`,
    outDir: `${root}src/data/ctf`,
    decrypt: sopsDecrypt,
    render: async (markdown) => (await renderer.render(markdown)).code,
  });
  console.log(`sealed ${result.doors.length} doors: ${result.doors.join(', ')}`);
} catch (error) {
  if (!(error instanceof SealError)) throw error;
  console.error(`ctf:seal: ${error.message}`);
  console.error('nothing in src/data/ctf was changed');
  process.exitCode = 1;
}
