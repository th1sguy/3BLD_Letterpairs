import './PairHeatmap.css';

export interface PairHeatmapProps {
  letters: string[];
  colorFor: (pairKey: string) => string;
  onCellClick?: (pairKey: string) => void;
}

export function PairHeatmap({ letters, colorFor, onCellClick }: PairHeatmapProps) {
  return (
    <div className="pair-heatmap-wrap">
      <table className="pair-heatmap">
        <thead>
          <tr>
            <th />
            {letters.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {letters.map((r) => (
            <tr key={r}>
              <th>{r}</th>
              {letters.map((c) => {
                const key = `${r}${c}`;
                return (
                  <td key={key}>
                    <button
                      type="button"
                      className="pair-heatmap-cell"
                      style={{ background: colorFor(key) }}
                      title={key}
                      onClick={() => onCellClick?.(key)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
