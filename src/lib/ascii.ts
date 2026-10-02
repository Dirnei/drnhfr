const CONTROL_NAMES = [
  'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL',
  'BS', 'HT', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
  'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
  'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US',
];

export interface AsciiRow {
  code: number;
  hex: string;
  bin: string;
  glyph: string;
  control: boolean;
}

function glyphOf(code: number): string {
  if (code < 32) return CONTROL_NAMES[code];
  if (code === 32) return 'SP';
  if (code === 127) return 'DEL';
  return String.fromCharCode(code);
}

export function asciiRows(): AsciiRow[] {
  return Array.from({ length: 128 }, (_, code) => ({
    code,
    hex: code.toString(16).toUpperCase().padStart(2, '0'),
    bin: code.toString(2).padStart(8, '0'),
    glyph: glyphOf(code),
    control: code < 32 || code === 127,
  }));
}
