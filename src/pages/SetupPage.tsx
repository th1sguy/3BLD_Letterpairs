import { useState } from 'react';
import { COLOR_SCHEME_PRESETS } from '../data/colorSchemes';
import { CORNER_STICKERS, EDGE_STICKERS } from '../data/layout';
import { DEFAULT_ALPHABET_LENGTH, alphabet } from '../data/pairs';
import {
  DEFAULT_KEY_BINDINGS,
  formatKeyBindingList,
  parseKeyBindingInput,
} from '../lib/keyBindings';
import type { AppSettings } from '../models';
import type { Face, LetterScheme, StickerPos } from '../types';
import './SetupPage.css';

const FACES: Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];

export interface SetupPageProps {
  settings: AppSettings;
  onChange: (updater: (settings: AppSettings) => AppSettings) => void;
}

function LetterSchemeEditor({
  stickers,
  scheme,
  onEdit,
}: {
  stickers: StickerPos[];
  scheme: LetterScheme;
  onEdit: (stickerId: string, letter: string) => void;
}) {
  return (
    <div className="letter-scheme-grid">
      {FACES.map((face) => (
        <div key={face} className="letter-scheme-face">
          <span className="letter-scheme-face-label">{face}</span>
          <div className="letter-scheme-face-inputs">
            {stickers
              .filter((s) => s.face === face)
              .map((sticker) => (
                <input
                  key={sticker.id}
                  value={scheme[sticker.id] ?? ''}
                  maxLength={1}
                  onChange={(e) => onEdit(sticker.id, e.target.value.toUpperCase().slice(0, 1))}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KeyBindingRow({
  label,
  tokens,
  onChange,
}: {
  label: string;
  tokens: string[];
  onChange: (tokens: string[]) => void;
}) {
  const [draft, setDraft] = useState(formatKeyBindingList(tokens));

  return (
    <label className="key-binding-row">
      {label}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onChange(parseKeyBindingInput(draft))}
      />
    </label>
  );
}

export function SetupPage({ settings, onChange }: SetupPageProps) {
  const matchingPreset = COLOR_SCHEME_PRESETS.find((p) =>
    FACES.every((f) => p.scheme[f] === settings.colorScheme[f]),
  );
  const presetValue = matchingPreset?.id ?? 'custom';

  function handlePresetChange(id: string) {
    if (id === 'custom') return;
    const preset = COLOR_SCHEME_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    onChange((s) => ({ ...s, colorScheme: preset.scheme }));
  }

  function handleFaceColorChange(face: Face, color: string) {
    onChange((s) => ({ ...s, colorScheme: { ...s.colorScheme, [face]: color } }));
  }

  function handleAlphabetLengthChange(value: number) {
    if (!Number.isFinite(value) || value < 2 || value > 26) return;
    onChange((s) => ({ ...s, alphabetLength: value }));
  }

  const pairAlphabet = alphabet(settings.alphabetLength);

  return (
    <div className="setup-page">
      <section>
        <h2>Pair alphabet</h2>
        <p className="hint">
          How many letters make up your letter-pair system. Default is {DEFAULT_ALPHABET_LENGTH}{' '}
          (A–{alphabet(DEFAULT_ALPHABET_LENGTH).at(-1)}), matching the 24 corner/edge stickers per
          type.
        </p>
        <label>
          Letters:{' '}
          <input
            type="number"
            min={2}
            max={26}
            value={settings.alphabetLength}
            onChange={(e) => handleAlphabetLengthChange(Number(e.target.value))}
          />
        </label>
        <p className="hint">
          {pairAlphabet[0]}–{pairAlphabet.at(-1)} · {pairAlphabet.length * pairAlphabet.length}{' '}
          possible pairs
        </p>
      </section>

      <section>
        <h2>Flashcard shortcuts</h2>
        <p className="hint">
          One-handed Recall shortcuts. Separate multiple keys with a comma or space, and type
          "Space" for the spacebar.
        </p>
        <div className="key-binding-rows">
          <KeyBindingRow
            key={formatKeyBindingList(settings.keyBindings.showOrNext)}
            label="Show answer / Next"
            tokens={settings.keyBindings.showOrNext}
            onChange={(tokens) =>
              onChange((s) => ({ ...s, keyBindings: { ...s.keyBindings, showOrNext: tokens } }))
            }
          />
          <KeyBindingRow
            key={formatKeyBindingList(settings.keyBindings.knewIt)}
            label="I knew it"
            tokens={settings.keyBindings.knewIt}
            onChange={(tokens) =>
              onChange((s) => ({ ...s, keyBindings: { ...s.keyBindings, knewIt: tokens } }))
            }
          />
          <KeyBindingRow
            key={formatKeyBindingList(settings.keyBindings.didnt)}
            label="I didn't"
            tokens={settings.keyBindings.didnt}
            onChange={(tokens) =>
              onChange((s) => ({ ...s, keyBindings: { ...s.keyBindings, didnt: tokens } }))
            }
          />
        </div>
        <button
          type="button"
          onClick={() => onChange((s) => ({ ...s, keyBindings: DEFAULT_KEY_BINDINGS }))}
        >
          Reset to defaults
        </button>
      </section>

      <section>
        <h2>Color scheme</h2>
        <p className="hint">Used only to render the cube-piece preview shown on every card.</p>
        <label>
          Preset:{' '}
          <select value={presetValue} onChange={(e) => handlePresetChange(e.target.value)}>
            {COLOR_SCHEME_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        <div className="face-color-grid">
          {FACES.map((face) => (
            <label key={face} className="face-color-swatch">
              {face}
              <input
                type="color"
                value={settings.colorScheme[face]}
                onChange={(e) => handleFaceColorChange(face, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2>Corner piece letters</h2>
        <p className="hint">
          Which letter each corner sticker maps to, for the piece preview. Edit to match your own
          Speffz variant.
        </p>
        <LetterSchemeEditor
          stickers={CORNER_STICKERS}
          scheme={settings.cornerLetters}
          onEdit={(id, letter) =>
            onChange((s) => ({ ...s, cornerLetters: { ...s.cornerLetters, [id]: letter } }))
          }
        />
      </section>

      <section>
        <h2>Edge piece letters</h2>
        <LetterSchemeEditor
          stickers={EDGE_STICKERS}
          scheme={settings.edgeLetters}
          onEdit={(id, letter) =>
            onChange((s) => ({ ...s, edgeLetters: { ...s.edgeLetters, [id]: letter } }))
          }
        />
      </section>
    </div>
  );
}
