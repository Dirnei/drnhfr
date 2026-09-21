/*
 * A compact block font for `figlet`.
 *
 * Deliberately NOT a real FIGfont: parsing standard.flf means shipping the
 * font file plus the smushing rules, which is more than ten kilobytes on a
 * bundle that is currently eleven — a lot to pay for a joke on a site that
 * makes no third-party requests at all. This is five rows, five columns, one
 * grid per glyph, and you can edit it by looking at it.
 *
 * '#' is ink, '.' is paper. Every row must be exactly GLYPH_WIDTH long; the
 * test suite checks that, because a short row silently skews the whole line.
 */
export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 5;

const INK = '█';

export const FONT: Record<string, readonly string[]> = {
  A: ['.###.', '#...#', '#####', '#...#', '#...#'],
  B: ['####.', '#...#', '####.', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '####.', '#....', '#####'],
  F: ['#####', '#....', '####.', '#....', '#....'],
  G: ['.####', '#....', '#.###', '#...#', '.###.'],
  H: ['#...#', '#...#', '#####', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '#####'],
  J: ['....#', '....#', '....#', '#...#', '.###.'],
  K: ['#...#', '#..#.', '###..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '####.', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '####.', '#..#.', '#...#'],
  S: ['.####', '#....', '.###.', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
  Z: ['#####', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#..##', '#.#.#', '##..#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '#####'],
  '2': ['.###.', '#...#', '..##.', '.#...', '#####'],
  '3': ['####.', '....#', '.###.', '....#', '####.'],
  '4': ['#..#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '####.'],
  '6': ['.###.', '#....', '####.', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '..#..'],
  '8': ['.###.', '#...#', '.###.', '#...#', '.###.'],
  '9': ['.###.', '#...#', '.####', '....#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '..#..'],
  ',': ['.....', '.....', '.....', '..#..', '.#...'],
  '-': ['.....', '.....', '#####', '.....', '.....'],
  _: ['.....', '.....', '.....', '.....', '#####'],
  '!': ['..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '..##.', '.....', '..#..'],
  ':': ['.....', '..#..', '.....', '..#..', '.....'],
  '/': ['....#', '...#.', '..#..', '.#...', '#....'],
  '@': ['.###.', '#...#', '#.###', '#....', '.###.'],
};

/** Anything with no glyph prints as a blank of the same width, not a gap. */
const MISSING = FONT[' '];

/**
 * Renders text as GLYPH_HEIGHT rows of block characters, one space between
 * glyphs. Returns the rows; the caller decides how to print them.
 */
export function renderBanner(text: string): string[] {
  const glyphs = [...text.toUpperCase()].map((char) => FONT[char] ?? MISSING);
  const rows: string[] = [];
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    const line = glyphs
      .map((glyph) => glyph[row].replaceAll('#', INK).replaceAll('.', ' '))
      .join(' ');
    // Trailing ink is impossible to see; trailing spaces just widen the box.
    rows.push(line.replace(/\s+$/, ''));
  }
  return rows;
}
