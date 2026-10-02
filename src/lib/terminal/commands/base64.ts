import type { Command } from '../types';

export class Base64Error extends Error {
  constructor(readonly reason: 'not-base64' | 'not-text') {
    super(reason);
  }
}

export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return btoa(String.fromCharCode(...bytes));
}

export function decodeBase64(input: string): string {
  const unpadded = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]*$/.test(unpadded) || unpadded.length % 4 === 1) {
    throw new Base64Error('not-base64');
  }
  const binary = atob(unpadded.padEnd(Math.ceil(unpadded.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Base64Error('not-text');
  }
}

const DECODE_FLAGS = ['-d', '--decode'];

export default {
  name: 'base64',
  usage: 'base64 [-d] <text>',
  summary: 'encode <text> as base64, -d to decode it again',
  order: 30,
  run(arg, ctx) {
    const trimmed = arg.trim();
    const [first = ''] = trimmed.split(/\s/, 1);
    const decode = DECODE_FLAGS.includes(first);
    if (!decode && first.startsWith('-')) {
      ctx.printError(`base64: unknown option ${first}, try -d to decode: base64 -d aGFsbG8=`);
      return;
    }
    const text = (decode ? trimmed.slice(first.length).trim() : trimmed) || ctx.stdin;
    if (!text) {
      ctx.printError(
        decode
          ? 'base64: nothing to decode, try: echo aGFsbG8= | base64 -d'
          : 'base64: nothing to encode, try: echo hallo | base64',
      );
      return;
    }
    if (!decode) {
      ctx.print(encodeBase64(text));
      return;
    }
    try {
      ctx.print(decodeBase64(text));
    } catch (error) {
      if (!(error instanceof Base64Error)) throw error;
      ctx.printError(
        error.reason === 'not-base64'
          ? 'base64: that is not base64, try: base64 -d aGFsbG8='
          : 'base64: that decodes to bytes that are not text, try: base64 -d aGFsbG8=',
      );
    }
  },
} satisfies Command;
