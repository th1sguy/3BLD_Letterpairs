const A_CHAR_CODE = 'A'.charCodeAt(0);

/** The default alphabet length: matches the 24 corner/edge stickers per type in speffz.ts. */
export const DEFAULT_ALPHABET_LENGTH = 24;

/** First `length` letters of the alphabet, A, B, C… (matches speffz.ts's lettering convention). */
export function alphabet(length: number): string[] {
  return Array.from({ length }, (_, i) => String.fromCharCode(A_CHAR_CODE + i));
}

export function pairKey(a: string, b: string): string {
  return `${a}${b}`.toUpperCase();
}

export function parsePairKey(key: string): [string, string] | undefined {
  const trimmed = key.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(trimmed)) return undefined;
  return [trimmed[0], trimmed[1]];
}

/** Every ordered letter x letter combination for the given alphabet length (N², no exclusions). */
export function allPairs(length: number): string[] {
  const letters = alphabet(length);
  const pairs: string[] = [];
  for (const a of letters) {
    for (const b of letters) {
      pairs.push(pairKey(a, b));
    }
  }
  return pairs;
}

export function isValidPairKey(key: string, alphabetLength: number): boolean {
  const parsed = parsePairKey(key);
  if (!parsed) return false;
  const maxCode = A_CHAR_CODE + alphabetLength - 1;
  return parsed.every((letter) => {
    const code = letter.charCodeAt(0);
    return code >= A_CHAR_CODE && code <= maxCode;
  });
}
