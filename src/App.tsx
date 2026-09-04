import { useState } from 'react';
import './App.css';
import { FlashcardPage } from './pages/FlashcardPage';
import { GuidePage } from './pages/GuidePage';
import { LibraryPage } from './pages/LibraryPage';
import { SetupPage } from './pages/SetupPage';
import { StatsPage } from './pages/StatsPage';
import { useLetterPairCards } from './state/cards';
import { useAnswerHistory } from './state/history';
import { useAppSettings } from './state/settings';

type Mode = 'setup' | 'library' | 'flashcards' | 'stats' | 'guide';

function App() {
  const [mode, setMode] = useState<Mode>('library');
  const [settings, setSettings] = useAppSettings();
  const { cards, upsertCard, clearCard, bulkUpsert, clearAll } = useLetterPairCards();
  const { history, appendRecord, amendLastRecord, clearHistory } = useAnswerHistory();

  return (
    <div className="app">
      <h1>BLD Letter Pairs</h1>

      <nav className="mode-nav">
        <button
          type="button"
          className={mode === 'library' ? 'active' : ''}
          onClick={() => setMode('library')}
        >
          Library
        </button>
        <button
          type="button"
          className={mode === 'flashcards' ? 'active' : ''}
          onClick={() => setMode('flashcards')}
        >
          Flashcards
        </button>
        <button
          type="button"
          className={mode === 'stats' ? 'active' : ''}
          onClick={() => setMode('stats')}
        >
          Stats
        </button>
        <button
          type="button"
          className={mode === 'setup' ? 'active' : ''}
          onClick={() => setMode('setup')}
        >
          Setup
        </button>
        <button
          type="button"
          className={mode === 'guide' ? 'active' : ''}
          onClick={() => setMode('guide')}
        >
          Guide
        </button>
      </nav>

      {mode === 'library' && (
        <LibraryPage
          settings={settings}
          cards={cards}
          onUpsertCard={upsertCard}
          onClearCard={clearCard}
          onBulkUpsert={bulkUpsert}
          onClearAll={clearAll}
        />
      )}
      {mode === 'flashcards' && (
        <FlashcardPage
          settings={settings}
          cards={cards}
          onAnswer={appendRecord}
          onAmendAnswer={amendLastRecord}
        />
      )}
      {mode === 'stats' && (
        <StatsPage settings={settings} cards={cards} history={history} onClear={clearHistory} />
      )}
      {mode === 'setup' && <SetupPage settings={settings} onChange={setSettings} />}
      {mode === 'guide' && <GuidePage />}
    </div>
  );
}

export default App;
