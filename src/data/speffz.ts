import { CORNER_STICKERS, EDGE_STICKERS } from './layout';
import type { LetterScheme } from '../types';

const A_CHAR_CODE = 'A'.charCodeAt(0);

/**
 * Best-effort default Speffz-style lettering: faces in U,L,F,R,B,D order, 4 stickers
 * per face lettered clockwise. Conventions vary between sources/personal variants,
 * so this is meant as an editable starting point, not an authoritative reference -
 * verify against your own scheme in setup before relying on it.
 */
function buildDefaultScheme(stickers: { id: string }[]): LetterScheme {
  const scheme: LetterScheme = {};
  stickers.forEach((sticker, index) => {
    scheme[sticker.id] = String.fromCharCode(A_CHAR_CODE + index);
  });
  return scheme;
}

export const DEFAULT_CORNER_SCHEME = buildDefaultScheme(CORNER_STICKERS);
export const DEFAULT_EDGE_SCHEME = buildDefaultScheme(EDGE_STICKERS);
