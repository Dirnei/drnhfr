import raw from './boot.json';
import type { Locale } from '../i18n/locales';

export interface BootLine {
  tag?: string;
  text: string;
  /**
   * Marks the one line where the boot sequence parks until the document is
   * visible, instead of running to completion unseen in a background tab.
   * See BootIntro.astro for the park/resume logic.
   */
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

// Assigning to the typed variable (rather than casting) makes a malformed or
// missing field in boot.json fail `astro check`, instead of rendering blank.
const data: BootData = raw;

export const bootTiming: BootTiming = data.timing;

export function bootLines(lang: Locale): BootLine[] {
  return data[lang];
}
