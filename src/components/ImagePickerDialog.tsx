import { useEffect, useState } from 'react';
import {
  searchOpenverse,
  searchWikipedia,
  type ImageSearchResult,
  type ImageSearchSource,
} from '../lib/imageSearch';
import './ImagePickerDialog.css';

export interface ImagePickerDialogProps {
  word: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

type SourceStatus = 'loading' | 'done' | 'error';
interface SourceState {
  status: SourceStatus;
  results: ImageSearchResult[];
}

const SOURCES: { source: ImageSearchSource; label: string; search: typeof searchOpenverse }[] = [
  { source: 'wikipedia', label: 'Wikipedia', search: searchWikipedia },
  { source: 'openverse', label: 'Openverse', search: searchOpenverse },
];

export function ImagePickerDialog({ word, onSelect, onClose }: ImagePickerDialogProps) {
  const [state, setState] = useState<Record<ImageSearchSource, SourceState>>({
    wikipedia: { status: 'loading', results: [] },
    openverse: { status: 'loading', results: [] },
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({
      wikipedia: { status: 'loading', results: [] },
      openverse: { status: 'loading', results: [] },
    });

    for (const { source, search } of SOURCES) {
      search(word, controller.signal)
        .then((results) => setState((s) => ({ ...s, [source]: { status: 'done', results } })))
        .catch((err) => {
          if (err instanceof Error && err.name === 'AbortError') return;
          setState((s) => ({ ...s, [source]: { status: 'error', results: [] } }));
        });
    }

    return () => controller.abort();
  }, [word]);

  return (
    <div className="image-picker-backdrop" role="dialog" aria-modal="true">
      <div className="image-picker-dialog">
        <div className="image-picker-header">
          <h2>Images for "{word}"</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {SOURCES.map(({ source, label }) => {
          const { status, results } = state[source];
          return (
            <div key={source} className="image-picker-section">
              <h3>{label}</h3>
              {status === 'loading' && <p className="hint">Searching…</p>}
              {status === 'error' && <p className="hint">Search failed.</p>}
              {status === 'done' && results.length === 0 && <p className="hint">No results.</p>}
              {results.length > 0 && (
                <div className="image-picker-grid">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="image-picker-thumb"
                      title={r.title}
                      onClick={() => onSelect(r.imageUrl)}
                    >
                      <img src={r.thumbnailUrl} alt={r.title} loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
