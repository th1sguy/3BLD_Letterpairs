import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageThumb } from '../components/ImageThumb';
import { PairPieceDisplay } from '../components/PairPieceDisplay';
import { alphabet } from '../data/pairs';
import { keyToken } from '../lib/keyBindings';
import type { AnswerMode, AnswerRecord, AppSettings, LetterPairCard } from '../models';
import './FlashcardPage.css';

const ALL_ROWS = 'all';

export interface FlashcardPageProps {
  settings: AppSettings;
  cards: Record<string, LetterPairCard>;
  onAnswer: (record: AnswerRecord) => void;
  onAmendAnswer: (patch: Partial<AnswerRecord>) => void;
}

type Phase = 'asking' | 'feedback';

function pickCard(pool: LetterPairCard[], avoidKey?: string): LetterPairCard {
  if (pool.length === 1) return pool[0];
  let candidate: LetterPairCard;
  do {
    candidate = pool[Math.floor(Math.random() * pool.length)];
  } while (candidate.key === avoidKey);
  return candidate;
}

function MnemonicSide({ card, settings }: { card: LetterPairCard; settings: AppSettings }) {
  return (
    <div className="mnemonic-side">
      {card.word && <p className="recall-word">{card.word}</p>}
      {card.notes && <p className="recall-notes">{card.notes}</p>}
      <ImageThumb
        className="recall-image"
        imageUrl={card.imageUrl}
        imageAssetId={card.imageAssetId}
        alt={card.key}
      />
      <PairPieceDisplay
        pairKey={card.key}
        colorScheme={settings.colorScheme}
        cornerLetters={settings.cornerLetters}
        edgeLetters={settings.edgeLetters}
        compact
      />
    </div>
  );
}

export function FlashcardPage({ settings, cards, onAnswer, onAmendAnswer }: FlashcardPageProps) {
  const [direction, setDirection] = useState<AnswerMode>('recall');
  const [row, setRow] = useState<string>(ALL_ROWS);
  const [current, setCurrent] = useState<LetterPairCard | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>('asking');
  const [guess, setGuess] = useState('');
  const [graded, setGraded] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [times, setTimes] = useState<number[]>([]);
  const [lastElapsedMs, setLastElapsedMs] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const askStartRef = useRef(0);

  const rows = useMemo(() => alphabet(settings.alphabetLength), [settings.alphabetLength]);

  const pool = useMemo(() => {
    const all = Object.values(cards).filter((c) => row === ALL_ROWS || c.key[0] === row);
    return direction === 'recall'
      ? all.filter((c) => c.word || c.notes || c.imageUrl || c.imageAssetId)
      : all.filter((c) => c.word || c.imageUrl || c.imageAssetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, direction, row]);

  function startNewSession() {
    setScore({ correct: 0, total: 0 });
    setTimes([]);
    setLastElapsedMs(null);
    setCurrent(pool.length > 0 ? pickCard(pool) : undefined);
    setPhase('asking');
    setGuess('');
    setGraded(false);
    askStartRef.current = performance.now();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(startNewSession, [direction, row, pool.length]);

  useEffect(() => {
    if (row !== ALL_ROWS && !rows.includes(row)) setRow(ALL_ROWS);
  }, [rows, row]);

  useEffect(() => {
    if (phase === 'asking' && direction === 'reverse') inputRef.current?.focus();
    else if (graded) nextButtonRef.current?.focus();
  }, [phase, graded, current, direction]);

  /** First grading of the current card: freezes the score/timer contribution and records history. */
  function commitAnswer(correct: boolean, elapsedMs: number) {
    if (!current) return;
    setWasCorrect(correct);
    setGraded(true);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setTimes((t) => [...t, elapsedMs]);
    setLastElapsedMs(elapsedMs);
    setPhase('feedback');
    onAnswer({
      pairKey: current.key,
      mode: direction,
      correct,
      elapsedMs,
      timestamp: Date.now(),
    });
  }

  /** Timer stops here — revealing the mnemonic is the recall moment being timed, not the self-grade click after it. */
  function handleShowAnswer() {
    if (!current) return;
    setLastElapsedMs(performance.now() - askStartRef.current);
    setPhase('feedback');
  }

  function handleSelfGrade(correct: boolean) {
    if (!current) return;
    if (!graded) {
      commitAnswer(correct, lastElapsedMs ?? 0);
      return;
    }
    // Already graded — let the user correct their self-assessment without re-counting time/attempts.
    if (correct === wasCorrect) return;
    setWasCorrect(correct);
    setScore((s) => ({ ...s, correct: s.correct + (correct ? 1 : -1) }));
    onAmendAnswer({ correct });
  }

  function handleReverseSubmit(value: string) {
    if (!current || phase !== 'asking') return;
    const elapsedMs = performance.now() - askStartRef.current;
    commitAnswer(value.toUpperCase() === current.key, elapsedMs);
  }

  function handleNext() {
    setCurrent(pickCard(pool, current?.key));
    setPhase('asking');
    setGuess('');
    setGraded(false);
    askStartRef.current = performance.now();
  }

  // One-handed shortcuts (configurable in Setup). Ignored while a text field has focus, so
  // they never interfere with typing a Reverse-mode guess or anything on another page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target;
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (isTextInput || !current) return;

      const token = keyToken(e);
      const { showOrNext, knewIt, didnt } = settings.keyBindings;

      if (showOrNext.includes(token)) {
        if (direction === 'recall' && phase === 'asking') {
          e.preventDefault();
          handleShowAnswer();
        } else if (graded) {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      if (direction === 'recall' && phase === 'feedback') {
        if (knewIt.includes(token)) {
          e.preventDefault();
          handleSelfGrade(true);
        } else if (didnt.includes(token)) {
          e.preventDefault();
          handleSelfGrade(false);
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="flashcard-page">
      <div className="filters">
        <div className="direction-toggle">
          <button
            type="button"
            className={direction === 'recall' ? 'active' : ''}
            onClick={() => setDirection('recall')}
          >
            Recall (pair → mnemonic)
          </button>
          <button
            type="button"
            className={direction === 'reverse' ? 'active' : ''}
            onClick={() => setDirection('reverse')}
          >
            Reverse (mnemonic → pair)
          </button>
        </div>
        <label className="row-filter">
          Row:{' '}
          <select value={row} onChange={(e) => setRow(e.target.value)}>
            <option value={ALL_ROWS}>All</option>
            {rows.map((letter) => (
              <option key={letter} value={letter}>
                {letter} ({letter}
                {rows[0]}–{letter}
                {rows.at(-1)})
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={startNewSession}>
          Reset session
        </button>
      </div>

      <p className="score">
        Score: {score.correct} / {score.total}
        {times.length > 0 && (
          <> · Avg: {(times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2)}s</>
        )}
      </p>

      {current ? (
        <>
          <div className="flashcard-card">
            {direction === 'recall' ? (
              phase === 'asking' ? (
                <p className="pair-key-display">{current.key}</p>
              ) : (
                <MnemonicSide card={current} settings={settings} />
              )
            ) : (
              <MnemonicSide card={current} settings={settings} />
            )}
          </div>

          <div className="flashcard-controls">
            {direction === 'recall' &&
              (phase === 'asking' ? (
                <button type="button" onClick={handleShowAnswer} className="show-answer">
                  Show answer
                </button>
              ) : (
                <div className="self-grade">
                  <button
                    type="button"
                    className={`self-grade-btn self-grade-btn--knew${
                      graded && wasCorrect ? ' active' : ''
                    }`}
                    onClick={() => handleSelfGrade(true)}
                  >
                    I knew it
                  </button>
                  <button
                    type="button"
                    className={`self-grade-btn self-grade-btn--didnt${
                      graded && !wasCorrect ? ' active' : ''
                    }`}
                    onClick={() => handleSelfGrade(false)}
                  >
                    I didn't
                  </button>
                </div>
              ))}

            {direction === 'reverse' && (
              <>
                <div className="answer-form">
                  <input
                    ref={inputRef}
                    value={guess}
                    maxLength={2}
                    disabled={phase === 'feedback'}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setGuess(value);
                      if (value.length === 2) handleReverseSubmit(value);
                    }}
                    autoFocus
                  />
                </div>
                {graded && (
                  <p className={`feedback ${wasCorrect ? 'feedback--correct' : 'feedback--wrong'}`}>
                    {wasCorrect ? 'Correct!' : `Incorrect — it was ${current.key}`}
                  </p>
                )}
              </>
            )}

            {graded && (
              <div className="feedback-footer">
                {lastElapsedMs !== null && (
                  <span className="elapsed">({(lastElapsedMs / 1000).toFixed(2)}s)</span>
                )}
                <button type="button" ref={nextButtonRef} onClick={handleNext}>
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="hint">
          No pairs{row !== ALL_ROWS ? ` in row ${row}` : ''} have enough content for {direction}{' '}
          mode yet — add some in the Library.
        </p>
      )}
    </div>
  );
}
