import type { Face, StickerPos } from '../types';

/** Where each face's 3x3 block sits in the overall unfolded net, in face-widths. */
export const FACE_NET_ORIGIN: Record<Face, { row: number; col: number }> = {
  U: { row: 0, col: 1 },
  L: { row: 1, col: 0 },
  F: { row: 1, col: 1 },
  R: { row: 1, col: 2 },
  B: { row: 1, col: 3 },
  D: { row: 2, col: 1 },
};

const FACE_ORDER: Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];

// Corner slots clockwise from top-left; edge slots clockwise from top.
const CORNER_LOCAL: Array<{ row: 0 | 1 | 2; col: 0 | 1 | 2 }> = [
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 2, col: 2 },
  { row: 2, col: 0 },
];
const EDGE_LOCAL: Array<{ row: 0 | 1 | 2; col: 0 | 1 | 2 }> = [
  { row: 0, col: 1 },
  { row: 1, col: 2 },
  { row: 2, col: 1 },
  { row: 1, col: 0 },
];

function buildStickers(type: 'corner' | 'edge'): StickerPos[] {
  const local = type === 'corner' ? CORNER_LOCAL : EDGE_LOCAL;
  const stickers: StickerPos[] = [];
  for (const face of FACE_ORDER) {
    local.forEach((pos, slot) => {
      stickers.push({
        id: `${type}-${face}-${slot}`,
        face,
        type,
        slot,
        row: pos.row,
        col: pos.col,
      });
    });
  }
  return stickers;
}

export const CORNER_STICKERS = buildStickers('corner');
export const EDGE_STICKERS = buildStickers('edge');
export const ALL_STICKERS = [...CORNER_STICKERS, ...EDGE_STICKERS];
