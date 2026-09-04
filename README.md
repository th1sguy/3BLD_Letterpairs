# BLD Letter Pairs

A flashcard trainer for memorizing 3x3x3 blindfolded (BLD) letter-pair mnemonics.

## Modes

- **Library** — a full N×N grid of every letter-pair combination. Click a pair to give
  it a word/mnemonic and an image (upload or URL); a cube-piece preview showing all
  four physical stickers the pair touches (each letter as both a corner and an edge)
  is always shown alongside. Import existing pairs from a CSV export (e.g. Google
  Sheets, either a one-row-per-pair list or a row/column grid) with flexible column
  mapping, export your pairs back out to CSV, or clear the whole grid to start over.
- **Flashcards** — **Recall** shows a pair and lets you self-grade after revealing your
  mnemonic; **Reverse** shows your word/image and auto-grades your typed 2-letter
  answer. Both render on a fixed-size white card. Recall supports one-handed keyboard
  shortcuts (default: Space for Show answer/Next, D/J and F/K for I knew it/I didn't),
  rebindable in Setup.
- **Stats** — accuracy and speed heatmaps over the full letter grid, a "needs work"
  table of your weakest pairs, and running totals. History persists across sessions in
  the browser (`localStorage`).
- **Setup** — set the pair alphabet length, a cube color scheme, corner/edge letter
  mappings (used only to render the cube-piece preview shown on every card), and the
  Flashcard keyboard shortcuts.
- **Guide** — a quick in-app explanation of how each mode works.

## Development

```
npm install
npm run dev
```

Then open the printed local URL in a browser.

```
npm run build   # type-check + production build
npm run lint    # oxlint
```

## Tech

React + TypeScript + Vite. No backend — card text/metadata and settings live in the
browser's `localStorage`; uploaded images live in `IndexedDB`.

## License

[GPL-3.0-or-later](LICENSE)
