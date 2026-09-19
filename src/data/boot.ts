import raw from './boot.json';
import type { Locale } from '../i18n/locales';

export interface BootLine {
  tag?: string;
  text: string;
}

export interface BootTiming {
  lineStepMs: number;
  logoHoldMs: number;
  fadeMs: number;
}

interface BootData {
  timing: BootTiming;
  de: BootLine[];
  en: BootLine[];
}

// Assigning to the typed variable (rather than casting) makes a malformed or
// missing field in boot.json fail `astro check`, instead of rendering blank.
const data: BootData = raw;

export const bootTiming: BootTiming = data.timing;

export function bootLines(lang: Locale): BootLine[] {
  return data[lang];
}
