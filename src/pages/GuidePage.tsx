import './GuidePage.css';

export function GuidePage() {
  return (
    <div className="guide-page">
      <section>
        <h2>Library</h2>
        <p>
          Every letter-pair combination (e.g. "AB") gets its own card. Click a cell in the grid to
          add a <strong>word/mnemonic</strong> and an <strong>image</strong> (upload a file or
          paste a URL). A <strong>cube piece</strong> preview is always shown alongside them — all
          four physical stickers the pair's two letters touch (each letter as both a corner and an
          edge), using the scheme from Setup. Use <strong>Import CSV</strong> to bring in pairs
          from a spreadsheet, <strong>Export CSV</strong> to back them up, and{' '}
          <strong>Clear grid</strong> to wipe everything and start over.
        </p>
      </section>

      <section>
        <h2>Flashcards</h2>
        <p>
          <strong>Recall</strong> shows a pair and lets you reveal your mnemonic to self-grade
          "I knew it" / "I didn't" — there's no single right answer to check against free-text
          recall. <strong>Reverse</strong> shows your word/image and asks you to type the 2-letter
          pair, which is graded automatically. Both modes only draw from pairs that have content —
          fill in the Library first.
        </p>
        <p>
          Recall supports one-handed keyboard shortcuts, by default <strong>Space</strong> for
          Show answer/Next and <strong>D/J</strong> · <strong>F/K</strong> for I knew it/I didn't
          (home-row keys either side of Space). Rebind them in Setup. The timer stops the moment
          you reveal the answer, not when you grade it, and re-clicking a different grade after
          the first just corrects your answer — it doesn't add another attempt.
        </p>
      </section>

      <section>
        <h2>Stats</h2>
        <p>
          Accuracy and speed heatmaps show how you're doing across the full letter grid, and the{' '}
          <strong>Needs work</strong> table highlights your weakest pairs (once answered at least 3
          times). History persists in your browser between sessions — <strong>Clear history</strong>{' '}
          wipes it for good.
        </p>
      </section>

      <section>
        <h2>Setup</h2>
        <p>
          The alphabet length controls how many letters (and how many N² pairs) exist. The color
          scheme and corner/edge letter mappings only affect the cube-piece preview shown on every
          card — they don't need to match anything else. Flashcard shortcuts can be rebound here
          too.
        </p>
      </section>
    </div>
  );
}
