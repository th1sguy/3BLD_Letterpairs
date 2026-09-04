import { useMemo, useState } from 'react';
import { ImagePickerDialog } from '../components/ImagePickerDialog';
import { ImageThumb } from '../components/ImageThumb';
import { ImportCsvDialog } from '../components/ImportCsvDialog';
import { PairPieceDisplay } from '../components/PairPieceDisplay';
import { toCsv } from '../lib/csv';
import { alphabet, isValidPairKey, parsePairKey } from '../data/pairs';
import { hasContent, type AppSettings, type LetterPairCard } from '../models';
import type { ConflictPolicy } from '../state/cards';
import { deleteImage, putImage } from '../state/imageStore';
import './LibraryPage.css';

export interface LibraryPageProps {
  settings: AppSettings;
  cards: Record<string, LetterPairCard>;
  onUpsertCard: (key: string, patch: Partial<Omit<LetterPairCard, 'key'>>) => void;
  onClearCard: (key: string) => void;
  onBulkUpsert: (cards: LetterPairCard[], policy: ConflictPolicy) => void;
  onClearAll: () => void;
}

type FilterMode = 'all' | 'filled' | 'empty';

function googleImageSearchUrl(word: string): string {
  const params = new URLSearchParams({ q: word, tbm: 'isch', tbs: 'isz:i' });
  return `https://www.google.com/search?${params.toString()}`;
}

function downloadCsv(cards: Record<string, LetterPairCard>) {
  const rows: string[][] = [['Pair', 'Word', 'Notes', 'Image URL']];
  Object.values(cards)
    .filter(hasContent)
    .sort((a, b) => a.key.localeCompare(b.key))
    .forEach((card) => {
      rows.push([card.key, card.word ?? '', card.notes ?? '', card.imageUrl ?? '']);
    });
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'letter-pairs.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function PairEditor({
  card,
  settings,
  onUpsertCard,
  onClearCard,
  onClose,
}: {
  card: LetterPairCard;
  settings: AppSettings;
  onUpsertCard: (key: string, patch: Partial<Omit<LetterPairCard, 'key'>>) => void;
  onClearCard: (key: string) => void;
  onClose: () => void;
}) {
  const [word, setWord] = useState(card.word ?? '');
  const [notes, setNotes] = useState(card.notes ?? '');
  const [urlDraft, setUrlDraft] = useState(card.imageUrl ?? '');
  const [showImagePicker, setShowImagePicker] = useState(false);

  async function handleFileUpload(file: File) {
    const oldAssetId = card.imageAssetId;
    const assetId = await putImage(file);
    onUpsertCard(card.key, { imageAssetId: assetId, imageUrl: undefined });
    if (oldAssetId) deleteImage(oldAssetId);
  }

  function handleUrlCommit() {
    const trimmed = urlDraft.trim();
    if (card.imageAssetId) deleteImage(card.imageAssetId);
    onUpsertCard(card.key, { imageUrl: trimmed || undefined, imageAssetId: undefined });
  }

  function handleRemoveImage() {
    if (card.imageAssetId) deleteImage(card.imageAssetId);
    setUrlDraft('');
    onUpsertCard(card.key, { imageUrl: undefined, imageAssetId: undefined });
  }

  function handlePickImage(url: string) {
    if (card.imageAssetId) deleteImage(card.imageAssetId);
    setUrlDraft(url);
    onUpsertCard(card.key, { imageUrl: url, imageAssetId: undefined });
    setShowImagePicker(false);
  }

  return (
    <div className="pair-editor">
      <div className="pair-editor-header">
        <h2>{card.key}</h2>
        <button type="button" onClick={onClose} aria-label="Close editor">
          ×
        </button>
      </div>

      <label className="pair-editor-field">
        Word / mnemonic
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onBlur={() => onUpsertCard(card.key, { word: word.trim() || undefined })}
        />
        {word.trim() && (
          <div className="pair-editor-image-search">
            <button type="button" onClick={() => setShowImagePicker(true)}>
              Find images for "{word.trim()}"
            </button>
            <a
              href={googleImageSearchUrl(word.trim())}
              target="_blank"
              rel="noopener noreferrer"
            >
              Search Google Images instead
            </a>
          </div>
        )}
      </label>

      {showImagePicker && (
        <ImagePickerDialog
          word={word.trim()}
          onSelect={handlePickImage}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      <label className="pair-editor-field">
        Notes
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onUpsertCard(card.key, { notes: notes.trim() || undefined })}
        />
      </label>

      <div className="pair-editor-field">
        <span>Image</span>
        {(card.imageUrl || card.imageAssetId) && (
          <div className="pair-editor-image-preview">
            <ImageThumb imageUrl={card.imageUrl} imageAssetId={card.imageAssetId} alt={card.key} />
            <button type="button" onClick={handleRemoveImage}>
              Remove image
            </button>
          </div>
        )}
        <div className="pair-editor-image-inputs">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <div className="pair-editor-url-row">
            <input
              type="url"
              placeholder="or paste an image URL"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={handleUrlCommit}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlCommit()}
            />
          </div>
        </div>
      </div>

      <div className="pair-editor-field">
        <span>Cube pieces</span>
        <PairPieceDisplay
          pairKey={card.key}
          colorScheme={settings.colorScheme}
          cornerLetters={settings.cornerLetters}
          edgeLetters={settings.edgeLetters}
          compact
        />
      </div>

      <button type="button" className="pair-editor-clear" onClick={() => onClearCard(card.key)}>
        Clear this card
      </button>
    </div>
  );
}

export function LibraryPage({
  settings,
  cards,
  onUpsertCard,
  onClearCard,
  onBulkUpsert,
  onClearAll,
}: LibraryPageProps) {
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showImport, setShowImport] = useState(false);

  const letters = useMemo(() => alphabet(settings.alphabetLength), [settings.alphabetLength]);

  const filledCount = useMemo(() => Object.values(cards).filter(hasContent).length, [cards]);
  const totalCount = letters.length * letters.length;

  function handleClearAll() {
    if (filledCount === 0) return;
    if (
      window.confirm(
        `Clear all ${filledCount} filled-in pair(s)? This deletes every word, image, and piece setting — it cannot be undone.`,
      )
    ) {
      onClearAll();
      setSelectedKey(undefined);
    }
  }

  function isVisible(key: string): boolean {
    const card = cards[key];
    if (filterMode === 'filled' && !hasContent(card)) return false;
    if (filterMode === 'empty' && hasContent(card)) return false;
    if (search.trim()) {
      const term = search.trim().toUpperCase();
      const matchesKey = key.includes(term);
      const matchesWord = card?.word?.toUpperCase().includes(term);
      if (!matchesKey && !matchesWord) return false;
    }
    return true;
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const parsed = parsePairKey(search);
    if (parsed && isValidPairKey(search, settings.alphabetLength)) {
      setSelectedKey(parsed.join(''));
    }
  }

  const selectedCard: LetterPairCard | undefined = selectedKey
    ? (cards[selectedKey] ?? { key: selectedKey, updatedAt: 0 })
    : undefined;

  return (
    <div className="library-page">
      <div className="library-toolbar">
        <input
          className="library-search"
          placeholder="Search pair or word… (Enter to jump)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        <div className="library-filter">
          <button
            type="button"
            className={filterMode === 'all' ? 'active' : ''}
            onClick={() => setFilterMode('all')}
          >
            All
          </button>
          <button
            type="button"
            className={filterMode === 'filled' ? 'active' : ''}
            onClick={() => setFilterMode('filled')}
          >
            Filled
          </button>
          <button
            type="button"
            className={filterMode === 'empty' ? 'active' : ''}
            onClick={() => setFilterMode('empty')}
          >
            Empty
          </button>
        </div>
        <div className="library-io">
          <button type="button" onClick={() => setShowImport(true)}>
            Import CSV
          </button>
          <button type="button" onClick={() => downloadCsv(cards)}>
            Export CSV
          </button>
          <button
            type="button"
            className="library-clear-all"
            disabled={filledCount === 0}
            onClick={handleClearAll}
          >
            Clear grid
          </button>
        </div>
      </div>

      <p className="hint">
        {filledCount} / {totalCount} pairs filled in
      </p>

      <div className="library-grid-wrap">
        <table className="library-grid">
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
                  const filled = hasContent(cards[key]);
                  const visible = isVisible(key);
                  return (
                    <td key={key}>
                      <button
                        type="button"
                        className={`library-cell${filled ? ' library-cell--filled' : ''}${
                          selectedKey === key ? ' library-cell--selected' : ''
                        }${visible ? '' : ' library-cell--dimmed'}`}
                        onClick={() => setSelectedKey(key)}
                        title={key}
                      >
                        {key}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCard && (
        <PairEditor
          key={selectedCard.key}
          card={selectedCard}
          settings={settings}
          onUpsertCard={onUpsertCard}
          onClearCard={(key) => {
            onClearCard(key);
            setSelectedKey(undefined);
          }}
          onClose={() => setSelectedKey(undefined)}
        />
      )}

      {showImport && (
        <ImportCsvDialog
          alphabetLength={settings.alphabetLength}
          existingCards={cards}
          onImport={onBulkUpsert}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
