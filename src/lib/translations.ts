import { slugOf } from './ids';

export interface TranslatableEntry {
  id: string;
}

export function findCounterpart<T extends TranslatableEntry>(
  entries: T[],
  slug: string,
): T | undefined {
  return entries.find((entry) => slugOf(entry.id) === slug);
}
