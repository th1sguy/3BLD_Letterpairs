import { ALL_STICKERS } from './layout';
import type { Direction, Face, StickerPos } from '../types';

/**
 * Which physical face touches each face at its up/right/down/left edge, when that
 * face is viewed the same way it's printed in the unfolded net (see layout.ts).
 * Derived from folding the net: F/U/R/D/L/B keep a consistent "up" direction around
 * the U-D axis, so corners/edges built from these tables land on the real cube's
 * named pieces (e.g. F's top-right + R's top-left both resolve to corner UFR).
 */
const NEIGHBOR: Record<Face, Record<Direction, Face>> = {
  F: { up: 'U', right: 'R', down: 'D', left: 'L' },
  U: { up: 'B', right: 'R', down: 'F', left: 'L' },
  D: { up: 'F', right: 'R', down: 'B', left: 'L' },
  L: { up: 'U', right: 'F', down: 'D', left: 'B' },
  R: { up: 'U', right: 'B', down: 'D', left: 'F' },
  B: { up: 'U', right: 'L', down: 'D', left: 'R' },
};

// Corner slot order matches layout.ts's CORNER_LOCAL: 0=top-left, 1=top-right, 2=bottom-right, 3=bottom-left.
const CORNER_SLOT_DIRECTIONS: [Direction, Direction][] = [
  ['up', 'left'],
  ['up', 'right'],
  ['right', 'down'],
  ['down', 'left'],
];

// Edge slot order matches layout.ts's EDGE_LOCAL: 0=top, 1=right, 2=bottom, 3=left.
const EDGE_SLOT_DIRECTION: Direction[] = ['up', 'right', 'down', 'left'];

export interface PiecePartner {
  direction: Direction;
  face: Face;
}

/** The other sticker(s) belonging to the same physical piece as `sticker`. */
export function getPartners(sticker: StickerPos): PiecePartner[] {
  const neighbors = NEIGHBOR[sticker.face];
  if (sticker.type === 'corner') {
    return CORNER_SLOT_DIRECTIONS[sticker.slot].map((direction) => ({
      direction,
      face: neighbors[direction],
    }));
  }
  const direction = EDGE_SLOT_DIRECTION[sticker.slot];
  return [{ direction, face: neighbors[direction] }];
}

/** A key shared by every sticker belonging to the same physical piece (e.g. "FRU" for corner UFR). */
function pieceKey(sticker: StickerPos): string {
  const faces = [sticker.face, ...getPartners(sticker).map((p) => p.face)];
  return faces.sort().join('');
}

const PIECE_SIBLINGS: Map<string, string[]> = (() => {
  const groups = new Map<string, string[]>();
  for (const sticker of ALL_STICKERS) {
    const key = pieceKey(sticker);
    const ids = groups.get(key) ?? [];
    ids.push(sticker.id);
    groups.set(key, ids);
  }
  return groups;
})();

/** Every sticker id belonging to the same physical piece as `sticker` (including itself). */
export function getPieceSiblingIds(sticker: StickerPos): string[] {
  return PIECE_SIBLINGS.get(pieceKey(sticker)) ?? [sticker.id];
}
