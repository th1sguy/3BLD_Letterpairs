import type { Direction } from '../types';
import './PieceCard.css';

export interface PieceCardProps {
  mainColor: string;
  partners: { direction: Direction; color: string }[];
  stickerId?: string;
  mainSize?: number;
  stripSize?: number;
}

export function PieceCard({
  mainColor,
  partners,
  stickerId,
  mainSize = 160,
  stripSize = 34,
}: PieceCardProps) {
  const byDirection = (d: Direction) => partners.find((p) => p.direction === d);
  const top = byDirection('up');
  const right = byDirection('right');
  const bottom = byDirection('down');
  const left = byDirection('left');

  return (
    <div
      className="piece-card"
      data-sticker-id={stickerId}
      style={{
        gridTemplateColumns: `${stripSize}px ${mainSize}px ${stripSize}px`,
        gridTemplateRows: `${stripSize}px ${mainSize}px ${stripSize}px`,
      }}
    >
      {top && <div className="piece-strip piece-strip--top" style={{ background: top.color }} />}
      {right && (
        <div className="piece-strip piece-strip--right" style={{ background: right.color }} />
      )}
      {bottom && (
        <div className="piece-strip piece-strip--bottom" style={{ background: bottom.color }} />
      )}
      {left && (
        <div className="piece-strip piece-strip--left" style={{ background: left.color }} />
      )}
      <div className="piece-main" style={{ background: mainColor }} />
    </div>
  );
}
