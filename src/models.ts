import type { KeyBindings } from './lib/keyBindings';
import type { ColorScheme, LetterScheme } from './types';

export interface LetterPairCard {
  /** "AB" — 2 uppercase letters, the pair identity (also the map key). */
  key: string;
  word?: string;
  notes?: string;
  /** External image URL — mutually exclusive with imageAssetId in the editor UI. */
  imageUrl?: string;
  /** IndexedDB blob id for an uploaded image — mutually exclusive with imageUrl in the editor UI. */
  imageAssetId?: string;
  updatedAt: number;
}

export function hasContent(card: LetterPairCard | undefined): boolean {
  if (!card) return false;
  return Boolean(card.word || card.notes || card.imageUrl || card.imageAssetId);
}

export type AnswerMode = 'recall' | 'reverse';

export interface AnswerRecord {
  pairKey: string;
  mode: AnswerMode;
  correct: boolean;
  elapsedMs: number;
  timestamp: number;
}

export interface AppSettings {
  colorScheme: ColorScheme;
  cornerLetters: LetterScheme;
  edgeLetters: LetterScheme;
  /** Letters A.. used to generate the N x N pair grid. */
  alphabetLength: number;
  /** One-handed Recall-mode shortcuts (Show answer/Next, I knew it, I didn't). */
  keyBindings: KeyBindings;
}
