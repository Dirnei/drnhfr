import raw from './boot.json';

export interface BootLine {
  tag?: string;
  text: string;
  holdUntilVisible?: boolean;
}

export interface BootTiming {
  lineStepMinMs: number;
  lineStepMaxMs: number;
}

interface BootData {
  timing: BootTiming;
  lines: BootLine[];
}

const data: BootData = raw;

export const bootTiming: BootTiming = data.timing;

export const bootLines: BootLine[] = data.lines;
