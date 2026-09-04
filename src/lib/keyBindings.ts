export interface KeyBindings {
  /** "Show answer" while asking, "Next" once graded. */
  showOrNext: string[];
  knewIt: string[];
  didnt: string[];
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  showOrNext: ['Space'],
  knewIt: ['d', 'j'],
  didnt: ['f', 'k'],
};

/** Normalizes a KeyboardEvent to the same token format stored in KeyBindings. */
export function keyToken(e: KeyboardEvent): string {
  if (e.key === ' ') return 'Space';
  return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

/** Parses a user-typed "d, j" / "Space" string into normalized tokens. */
export function parseKeyBindingInput(text: string): string[] {
  return text
    .split(/[,\s]+/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => (raw.toLowerCase() === 'space' ? 'Space' : raw.length === 1 ? raw.toLowerCase() : raw));
}

export function formatKeyBindingList(tokens: string[]): string {
  return tokens.join(', ');
}
