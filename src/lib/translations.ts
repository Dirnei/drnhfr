export interface TranslatableEntry {
  id: string;
  data: { translationKey: string };
}

export function findCounterpart<T extends TranslatableEntry>(
  entries: T[],
  translationKey: string,
): T | undefined {
  return entries.find((entry) => entry.data.translationKey === translationKey);
}
