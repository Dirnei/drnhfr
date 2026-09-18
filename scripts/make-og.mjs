import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const COPY = {
  de: { headline: 'SYSTEME, DIE HALTEN.', kicker: 'SOFTWAREARCHITEKT &amp; TINKERER' },
  en: { headline: 'SYSTEMS THAT HOLD.', kicker: 'SOFTWARE ARCHITECT &amp; TINKERER' },
};

function card({ headline, kicker }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0a0a0b"/>
  <g transform="translate(80,80) scale(1.6)">
    <rect width="78" height="78" fill="#000000"/>
    <rect x="6" y="6" width="66" height="6" fill="#da1515"/>
    <rect x="6" y="66" width="66" height="6" fill="#da1515"/>
  </g>
  <text x="80" y="420" fill="#da1515" font-family="monospace" font-size="22"
        letter-spacing="6">${kicker}</text>
  <text x="80" y="510" fill="#f2f2f2" font-family="sans-serif" font-size="82"
        font-weight="800" letter-spacing="-2">${headline}</text>
  <text x="80" y="566" fill="#8d919b" font-family="monospace" font-size="22">dirnhofer.net</text>
</svg>`;
}

for (const [lang, copy] of Object.entries(COPY)) {
  const png = await sharp(Buffer.from(card(copy))).png().toBuffer();
  await writeFile(`public/og-${lang}.png`, png);
  console.log(`wrote public/og-${lang}.png`);
}
