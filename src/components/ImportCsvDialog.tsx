import { useMemo, useRef, useState } from 'react';
import { parseCsv } from '../lib/csv';
import { isValidPairKey, parsePairKey } from '../data/pairs';
import { hasContent, type LetterPairCard } from '../models';
import type { ConflictPolicy } from '../state/cards';
import './ImportCsvDialog.css';

export interface ImportCsvDialogProps {
  alphabetLength: number;
  existingCards: Record<string, LetterPairCard>;
  onImport: (cards: LetterPairCard[], policy: ConflictPolicy) => void;
  onClose: () => void;
}

type Step = 'input' | 'map' | 'preview';
type Format = 'list' | 'grid';
/** Which axis supplies the first letter of the pair key. */
type GridAxisOrder = 'row-col' | 'col-row';
type TargetField = 'pairKey' | 'word' | 'notes' | 'imageUrl' | '';

const FIELD_LABELS: Record<Exclude<TargetField, ''>, string> = {
  pairKey: 'Pair key',
  word: 'Word / mnemonic',
  notes: 'Notes',
  imageUrl: 'Image URL',
};

const SINGLE_LETTER = /^[A-Za-z]$/;

/** Grid format: a corner-blank header row of column letters, and each data row starts with a row letter. */
function detectFormat(rows: string[][]): Format {
  if (rows.length < 2) return 'list';
  const header = rows[0];
  const headerLooksLikeLetters =
    header.length > 1 && header.slice(1).every((cell) => SINGLE_LETTER.test(cell.trim()));
  const dataRowsLookLikeLetters = rows
    .slice(1)
    .every((row) => SINGLE_LETTER.test((row[0] ?? '').trim()));
  return headerLooksLikeLetters && dataRowsLookLikeLetters ? 'grid' : 'list';
}

function guessMapping(headers: string[]): Record<number, TargetField> {
  const mapping: Record<number, TargetField> = {};
  headers.forEach((header, i) => {
    const h = header.trim().toLowerCase();
    if (!mapping[i]) {
      if (/^(pair|key|letters?)/.test(h)) mapping[i] = 'pairKey';
      else if (/word|mnemonic|memo/.test(h)) mapping[i] = 'word';
      else if (/image|picture|img/.test(h)) mapping[i] = 'imageUrl';
      else if (/note/.test(h)) mapping[i] = 'notes';
    }
  });
  return mapping;
}

interface PreviewRow {
  pairKey: string;
  card?: LetterPairCard;
  error?: string;
  isConflict: boolean;
}

function buildListPreviewRows(
  dataRows: string[][],
  mapping: Record<number, TargetField>,
  pairKeyColumn: number | undefined,
  alphabetLength: number,
  existingCards: Record<string, LetterPairCard>,
): PreviewRow[] {
  if (pairKeyColumn === undefined) return [];
  return dataRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row): PreviewRow => {
      const rawKey = row[pairKeyColumn] ?? '';
      const parsed = parsePairKey(rawKey);
      if (!parsed || !isValidPairKey(rawKey, alphabetLength)) {
        return { pairKey: rawKey, error: `Invalid pair key "${rawKey}"`, isConflict: false };
      }
      const key = parsed.join('');
      // updatedAt is a placeholder here — bulkUpsert stamps the real value on commit.
      const card: LetterPairCard = { key, updatedAt: 0 };
      for (const [idxStr, field] of Object.entries(mapping)) {
        const idx = Number(idxStr);
        const value = row[idx]?.trim();
        if (!value) continue;
        if (field === 'word') card.word = value;
        else if (field === 'notes') card.notes = value;
        else if (field === 'imageUrl') card.imageUrl = value;
      }
      return { pairKey: key, card, isConflict: hasContent(existingCards[key]) };
    });
}

interface GridExample {
  rowLetter: string;
  colLetter: string;
  value: string;
}

/**
 * First non-blank grid cell whose row/column letters differ, used to show a concrete
 * "row X, column Y -> key" example. A row===column cell (e.g. "AA") reads the same either
 * way the axis order is flipped, so it wouldn't help confirm which order is correct.
 */
function findGridExample(rows: string[][]): GridExample | undefined {
  if (rows.length < 2) return undefined;
  const colLetters = rows[0].slice(1).map((c) => c.trim().toUpperCase());
  let fallback: GridExample | undefined;
  for (const row of rows.slice(1)) {
    const rowLetter = (row[0] ?? '').trim().toUpperCase();
    if (!rowLetter) continue;
    for (let i = 0; i < colLetters.length; i++) {
      const value = row[i + 1]?.trim();
      if (!value) continue;
      const colLetter = colLetters[i];
      const example = { rowLetter, colLetter, value };
      if (rowLetter !== colLetter) return example;
      fallback ??= example;
    }
  }
  return fallback;
}

/**
 * Grid format: rows[0] is a header of column letters (first cell blank/ignored), each
 * subsequent row starts with a row letter, and cell (row, col) is the word for that pair.
 * Blank cells are simply skipped (nothing to import), not treated as errors.
 */
function buildGridPreviewRows(
  rows: string[][],
  axisOrder: GridAxisOrder,
  alphabetLength: number,
  existingCards: Record<string, LetterPairCard>,
): PreviewRow[] {
  const colLetters = rows[0].slice(1).map((c) => c.trim().toUpperCase());
  const out: PreviewRow[] = [];
  for (const row of rows.slice(1)) {
    const rowLetter = (row[0] ?? '').trim().toUpperCase();
    if (!rowLetter) continue;
    colLetters.forEach((colLetter, i) => {
      const value = row[i + 1]?.trim();
      if (!value) return;
      const key =
        axisOrder === 'row-col' ? `${rowLetter}${colLetter}` : `${colLetter}${rowLetter}`;
      if (!isValidPairKey(key, alphabetLength)) {
        out.push({ pairKey: key, error: `Invalid pair key "${key}"`, isConflict: false });
        return;
      }
      const card: LetterPairCard = { key, word: value, updatedAt: 0 };
      out.push({ pairKey: key, card, isConflict: hasContent(existingCards[key]) });
    });
  }
  return out;
}

export function ImportCsvDialog({
  alphabetLength,
  existingCards,
  onImport,
  onClose,
}: ImportCsvDialogProps) {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [rows, setRows] = useState<string[][]>([]);
  const [format, setFormat] = useState<Format>('list');
  const [gridAxisOrder, setGridAxisOrder] = useState<GridAxisOrder>('row-col');
  const [mapping, setMapping] = useState<Record<number, TargetField>>({});
  const [policy, setPolicy] = useState<ConflictPolicy>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);

  function loadRows(parsed: string[][]) {
    if (parsed.length === 0) return;
    setRows(parsed);
    setFormat(detectFormat(parsed));
    setMapping(guessMapping(parsed[0]));
    setStep('map');
  }

  function handleParse() {
    loadRows(parseCsv(text));
  }

  function handleFile(file: File) {
    file.text().then((content) => {
      setText(content);
      loadRows(parseCsv(content));
    });
  }

  const pairKeyColumn = useMemo(() => {
    const entry = Object.entries(mapping).find(([, field]) => field === 'pairKey');
    return entry ? Number(entry[0]) : undefined;
  }, [mapping]);

  const previewRows: PreviewRow[] = useMemo(() => {
    if (format === 'grid') {
      return buildGridPreviewRows(rows, gridAxisOrder, alphabetLength, existingCards);
    }
    return buildListPreviewRows(dataRows, mapping, pairKeyColumn, alphabetLength, existingCards);
  }, [format, rows, gridAxisOrder, dataRows, mapping, pairKeyColumn, alphabetLength, existingCards]);

  const gridExample = format === 'grid' ? findGridExample(rows) : undefined;

  const validRows = previewRows.filter((r) => r.card);
  const invalidRows = previewRows.filter((r) => r.error);
  const conflictRows = validRows.filter((r) => r.isConflict);
  const newRows = validRows.filter((r) => !r.isConflict);
  const canProceed = format === 'grid' ? rows.length > 1 : pairKeyColumn !== undefined;

  function handleCommit() {
    const cardsToImport = validRows
      .filter((r) => !r.isConflict || policy === 'overwrite')
      .map((r) => r.card!);
    onImport(cardsToImport, policy);
    onClose();
  }

  return (
    <div className="import-dialog-backdrop" role="dialog" aria-modal="true">
      <div className="import-dialog">
        <div className="import-dialog-header">
          <h2>Import CSV</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {step === 'input' && (
          <div className="import-step">
            <p className="hint">
              Paste your CSV below, or upload a file. Two layouts are supported: a{' '}
              <strong>list</strong> (one row per pair, e.g. "AB, Airbus"), or a{' '}
              <strong>grid</strong> exported straight from a spreadsheet shaped like the Library
              view — a header row of column letters, a row letter in each row's first cell, and
              the mnemonic in each cell. The layout is detected automatically; you can override it
              on the next step.
            </p>
            <textarea
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pair,Word,Image URL&#10;AB,Airbus,https://..."
            />
            <div className="import-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <button type="button" disabled={!text.trim()} onClick={handleParse}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="import-step">
            <div className="import-format-toggle">
              <span>Layout:</span>
              <label>
                <input
                  type="radio"
                  checked={format === 'list'}
                  onChange={() => setFormat('list')}
                />
                List (one row per pair)
              </label>
              <label>
                <input
                  type="radio"
                  checked={format === 'grid'}
                  onChange={() => setFormat('grid')}
                />
                Grid (row/column letters, like the Library view)
              </label>
            </div>

            {format === 'grid' ? (
              <>
                <p className="hint">
                  Treating the top-left cell as the ignored corner,{' '}
                  {Math.max(headers.length - 1, 0)} column letters from the header row, and{' '}
                  {dataRows.length} row letters down the first column. Each non-blank cell becomes
                  that pair's word/mnemonic. Blank cells are skipped, not treated as errors.
                </p>

                <div className="import-format-toggle">
                  <span>Pair key order:</span>
                  <label>
                    <input
                      type="radio"
                      checked={gridAxisOrder === 'row-col'}
                      onChange={() => setGridAxisOrder('row-col')}
                    />
                    Row letter first
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={gridAxisOrder === 'col-row'}
                      onChange={() => setGridAxisOrder('col-row')}
                    />
                    Column letter first
                  </label>
                </div>

                {gridExample && (
                  <p className="hint">
                    Example: row {gridExample.rowLetter}, column {gridExample.colLetter} ("
                    {gridExample.value}") will import as pair{' '}
                    <strong>
                      {gridAxisOrder === 'row-col'
                        ? `${gridExample.rowLetter}${gridExample.colLetter}`
                        : `${gridExample.colLetter}${gridExample.rowLetter}`}
                    </strong>
                    . Check this against your spreadsheet and flip the order above if it's
                    backwards.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="hint">Map each column to a field. Pair key is required.</p>
                <table className="import-mapping-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Maps to</th>
                      <th>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((header, i) => (
                      <tr key={i}>
                        <td>{header || `Column ${i + 1}`}</td>
                        <td>
                          <select
                            value={mapping[i] ?? ''}
                            onChange={(e) =>
                              setMapping((m) => ({ ...m, [i]: e.target.value as TargetField }))
                            }
                          >
                            <option value="">(ignore)</option>
                            {(Object.keys(FIELD_LABELS) as Exclude<TargetField, ''>[]).map((f) => (
                              <option key={f} value={f}>
                                {FIELD_LABELS[f]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="import-example">{dataRows[0]?.[i] ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="import-actions">
              <button type="button" onClick={() => setStep('input')}>
                Back
              </button>
              <button type="button" disabled={!canProceed} onClick={() => setStep('preview')}>
                Next: preview
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="import-step">
            <ul className="import-summary">
              <li>{newRows.length} new pair(s)</li>
              <li>{conflictRows.length} conflict(s) with existing cards</li>
              <li>{invalidRows.length} invalid row(s), will be skipped</li>
            </ul>

            {conflictRows.length > 0 && (
              <div className="import-conflict-policy">
                <label>
                  <input
                    type="radio"
                    checked={policy === 'skip'}
                    onChange={() => setPolicy('skip')}
                  />
                  Skip existing (only fill in new pairs)
                </label>
                <label>
                  <input
                    type="radio"
                    checked={policy === 'overwrite'}
                    onChange={() => setPolicy('overwrite')}
                  />
                  Overwrite existing
                </label>
              </div>
            )}

            {invalidRows.length > 0 && (
              <details className="import-invalid-details">
                <summary>Show invalid rows</summary>
                <ul>
                  {invalidRows.slice(0, 20).map((r, i) => (
                    <li key={i}>{r.error}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="import-actions">
              <button type="button" onClick={() => setStep('map')}>
                Back
              </button>
              <button type="button" disabled={validRows.length === 0} onClick={handleCommit}>
                Import {policy === 'overwrite' ? validRows.length : newRows.length} pair(s)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
