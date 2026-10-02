import { pathToFileURL } from 'node:url';

const DARTS = [
  ...Array.from({ length: 20 }, (_, i) => [`T${i + 1}`, 3 * (i + 1)]),
  ['BULL', 50],
  ...Array.from({ length: 20 }, (_, i) => [`D${i + 1}`, 2 * (i + 1)]),
  ['25', 25],
  ...Array.from({ length: 20 }, (_, i) => [`${i + 1}`, i + 1]),
].sort((a, b) => b[1] - a[1]);

export function visitFor(score) {
  for (const first of DARTS) {
    for (const second of DARTS) {
      if (second[1] > first[1]) continue;
      for (const third of DARTS) {
        if (third[1] > second[1]) continue;
        if (first[1] + second[1] + third[1] === score) return [first[0], second[0], third[0]];
      }
    }
  }
  throw new Error(`${score} is not a three-dart score`);
}

export function dartLog(text) {
  return [...text].map((char, index) => {
    const score = char.charCodeAt(0);
    const darts = visitFor(score).map((dart) => dart.padEnd(4)).join(' ');
    return `${String(index + 1).padStart(2, '0')}  ${darts}  ${String(score).padStart(3)}`;
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.stdout.write(dartLog(process.argv[2] ?? '').join('\n') + '\n');
}
