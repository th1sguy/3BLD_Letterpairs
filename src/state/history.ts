import { useEffect, useState } from 'react';
import type { AnswerRecord } from '../models';

const STORAGE_KEY = 'blp-history';
const MAX_RECORDS = 5000;

function loadHistory(): AnswerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnswerRecord[]) : [];
  } catch {
    return [];
  }
}

export function useAnswerHistory() {
  const [history, setHistory] = useState<AnswerRecord[]>(loadHistory);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  function appendRecord(record: AnswerRecord) {
    setHistory((h) => [...h, record].slice(-MAX_RECORDS));
  }

  /** Corrects the most recently appended record (e.g. the user changed a self-graded answer). */
  function amendLastRecord(patch: Partial<AnswerRecord>) {
    setHistory((h) => {
      if (h.length === 0) return h;
      const next = [...h];
      next[next.length - 1] = { ...next[next.length - 1], ...patch };
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
  }

  return { history, appendRecord, amendLastRecord, clearHistory };
}
