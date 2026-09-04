import { useMemo } from 'react';
import { CORNER_STICKERS, EDGE_STICKERS } from '../data/layout';
import { getPartners } from '../data/pieceGeometry';
import type { ColorScheme, LetterScheme, PieceType, StickerPos } from '../types';
import { PieceCard } from './PieceCard';
import './PairPieceDisplay.css';

export interface PairPieceDisplayProps {
  pairKey: string;
  colorScheme: ColorScheme;
  cornerLetters: LetterScheme;
  edgeLetters: LetterScheme;
  /** Smaller piece cards, for fitting inside a flashcard alongside an image. */
  compact?: boolean;
}

function buildLetterMap(scheme: LetterScheme, stickers: StickerPos[]): Map<string, StickerPos> {
  const byId = new Map(stickers.map((s) => [s.id, s]));
  const map = new Map<string, StickerPos>();
  for (const [stickerId, letter] of Object.entries(scheme)) {
    const sticker = byId.get(stickerId);
    if (sticker) map.set(letter.toUpperCase(), sticker);
  }
  return map;
}

function SinglePiece({
  letter,
  sticker,
  colorScheme,
  mainSize,
  stripSize,
}: {
  letter: string;
  sticker: StickerPos | undefined;
  colorScheme: ColorScheme;
  mainSize: number;
  stripSize: number;
}) {
  return (
    <div className="pair-piece">
      <span className="pair-piece-letter">{letter}</span>
      {sticker ? (
        <PieceCard
          stickerId={sticker.id}
          mainColor={colorScheme[sticker.face]}
          partners={getPartners(sticker).map((p) => ({
            direction: p.direction,
            color: colorScheme[p.face],
          }))}
          mainSize={mainSize}
          stripSize={stripSize}
        />
      ) : (
        <div className="pair-piece-missing" style={{ width: mainSize, height: mainSize }}>
          not mapped
        </div>
      )}
    </div>
  );
}

function PieceGroup({
  label,
  pairKey,
  pieceType,
  scheme,
  stickers,
  colorScheme,
  mainSize,
  stripSize,
}: {
  label: string;
  pairKey: string;
  pieceType: PieceType;
  scheme: LetterScheme;
  stickers: StickerPos[];
  colorScheme: ColorScheme;
  mainSize: number;
  stripSize: number;
}) {
  const letterMap = useMemo(() => buildLetterMap(scheme, stickers), [scheme, stickers]);
  const [a, b] = pairKey.split('');

  return (
    <div className="pair-piece-group" data-piece-type={pieceType}>
      <span className="pair-piece-group-label">{label}</span>
      <div className="pair-piece-display">
        <SinglePiece
          letter={a}
          sticker={letterMap.get(a)}
          colorScheme={colorScheme}
          mainSize={mainSize}
          stripSize={stripSize}
        />
        <SinglePiece
          letter={b}
          sticker={letterMap.get(b)}
          colorScheme={colorScheme}
          mainSize={mainSize}
          stripSize={stripSize}
        />
      </div>
    </div>
  );
}

/** Shows all four cube pieces a letter pair touches: each of its two letters, as both a corner and an edge. */
export function PairPieceDisplay({
  pairKey,
  colorScheme,
  cornerLetters,
  edgeLetters,
  compact,
}: PairPieceDisplayProps) {
  const mainSize = compact ? 56 : 160;
  const stripSize = compact ? 14 : 34;

  return (
    <div className="cube-piece-preview">
      <PieceGroup
        label="Corner"
        pairKey={pairKey}
        pieceType="corner"
        scheme={cornerLetters}
        stickers={CORNER_STICKERS}
        colorScheme={colorScheme}
        mainSize={mainSize}
        stripSize={stripSize}
      />
      <PieceGroup
        label="Edge"
        pairKey={pairKey}
        pieceType="edge"
        scheme={edgeLetters}
        stickers={EDGE_STICKERS}
        colorScheme={colorScheme}
        mainSize={mainSize}
        stripSize={stripSize}
      />
    </div>
  );
}
