import { useEffect, useState } from 'react';
import type { LetterPairCard } from '../models';
import { deleteImage } from './imageStore';

const STORAGE_KEY = 'blp-cards';

function loadCards(): Record<string, LetterPairCard> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, LetterPairCard>) : {};
  } catch {
    return {};
  }
}

export type ConflictPolicy = 'overwrite' | 'skip';

export function useLetterPairCards() {
  const [cards, setCards] = useState<Record<string, LetterPairCard>>(loadCards);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  function upsertCard(key: string, patch: Partial<Omit<LetterPairCard, 'key'>>) {
    setCards((c) => ({
      ...c,
      [key]: { ...c[key], ...patch, key, updatedAt: Date.now() },
    }));
  }

  function clearCard(key: string) {
    setCards((c) => {
      const next = { ...c };
      delete next[key];
      return next;
    });
  }

  /** Merge many cards at once (CSV import). `policy` decides what happens for keys that already exist. */
  function bulkUpsert(incoming: LetterPairCard[], policy: ConflictPolicy) {
    setCards((c) => {
      const next = { ...c };
      for (const card of incoming) {
        if (policy === 'skip' && next[card.key]) continue;
        next[card.key] = { ...card, updatedAt: Date.now() };
      }
      return next;
    });
  }

  /** Wipe every card (and any uploaded images they reference) — used to clear the grid. */
  function clearAll() {
    for (const card of Object.values(cards)) {
      if (card.imageAssetId) deleteImage(card.imageAssetId);
    }
    setCards({});
  }

  return { cards, upsertCard, clearCard, bulkUpsert, clearAll };
}
