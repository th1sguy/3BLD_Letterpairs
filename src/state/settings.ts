import { useEffect, useState } from 'react';
import { DEFAULT_COLOR_SCHEME } from '../data/colorSchemes';
import { DEFAULT_ALPHABET_LENGTH } from '../data/pairs';
import { DEFAULT_CORNER_SCHEME, DEFAULT_EDGE_SCHEME } from '../data/speffz';
import { DEFAULT_KEY_BINDINGS } from '../lib/keyBindings';
import type { AppSettings } from '../models';

const STORAGE_KEY = 'blp-settings';

function defaultSettings(): AppSettings {
  return {
    colorScheme: DEFAULT_COLOR_SCHEME,
    cornerLetters: DEFAULT_CORNER_SCHEME,
    edgeLetters: DEFAULT_EDGE_SCHEME,
    alphabetLength: DEFAULT_ALPHABET_LENGTH,
    keyBindings: DEFAULT_KEY_BINDINGS,
  };
}

function loadSettings(): AppSettings {
  const defaults = defaultSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      colorScheme: { ...defaults.colorScheme, ...parsed.colorScheme },
      cornerLetters: { ...defaults.cornerLetters, ...parsed.cornerLetters },
      edgeLetters: { ...defaults.edgeLetters, ...parsed.edgeLetters },
      alphabetLength: parsed.alphabetLength ?? defaults.alphabetLength,
      keyBindings: { ...defaults.keyBindings, ...parsed.keyBindings },
    };
  } catch {
    return defaults;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return [settings, setSettings] as const;
}
