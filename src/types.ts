export type Face = 'U' | 'L' | 'F' | 'R' | 'B' | 'D';
export type PieceType = 'corner' | 'edge';
export type Direction = 'up' | 'right' | 'down' | 'left';

/** A single lettered sticker location, fixed by position (not by what color sits there). */
export interface StickerPos {
  id: string;
  face: Face;
  type: PieceType;
  /** Rotational slot within the face: corners/edges each go 0-3 clockwise from top-left/top. */
  slot: number;
  /** Position within the face's local 3x3 grid. */
  row: 0 | 1 | 2;
  col: 0 | 1 | 2;
}

export type ColorScheme = Record<Face, string>;

export type LetterScheme = Record<string, string>;
