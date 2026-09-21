import raw from './boot.json';
import type { Locale } from '../i18n/locales';

export interface BootLine {
  tag?: string;
  text: string;
  holdUntilVisible?: boolean;
}

export interface BootTiming {
  lineStepMinMs: number;
  lineStepMaxMs: number;
  logoHoldMs: number;
  fadeMs: number;
}

interface BootData {
  timing: BootTiming;
  de: BootLine[];
  en: BootLine[];
}

const data: BootData = raw;

export const bootTiming: BootTiming = data.timing;

export function bootLines(lang: Locale): BootLine[] {
  return data[lang];
}
