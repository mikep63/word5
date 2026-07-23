# Word5

A free, static, browser-based solver for Wordle-style five-letter word
puzzles. Enter your guesses, mark each letter with the clue color the game
gave you, and Word5 filters a curated answer list down to every word that
still fits — with suggestions for a strong next guess.

**Live site:** https://mikep63.github.io/word5/

## How to use

1. Type a guess into a row of the grid (letters advance automatically;
   Backspace deletes, arrow keys move around).
2. Click each tile (or press Space/Enter on it) to cycle its clue color:
   - **Slate** — letter not in the word
   - **Amber** — letter in the word, wrong spot
   - **Teal** — letter in the correct spot
3. Once all five tiles in a row have a letter and a color, the candidate
   list updates instantly. Add more rows to narrow further.
4. Use a suggested next guess, or pick any remaining candidate.
5. **Reset board** clears everything.

## Features

- **Duplicate-letter accuracy** — a word survives filtering only if
  guessing your word against it would reproduce your exact clue pattern,
  matching real Wordle behavior for repeated letters (e.g. a gray E next
  to a yellow E means "exactly one E").
- **Next-guess suggestions** — ranked by letter frequency for large
  candidate pools, switching to an entropy calculation (which guess best
  splits the remaining possibilities) once 200 or fewer words remain.
- **Curated word list** — ~2,315 realistic answer words from
  community-maintained lists, not a raw dictionary full of obscure
  plurals.
- **Fully static** — plain HTML, CSS, and vanilla JavaScript. No build
  step, no server, no dependencies. Open `index.html` locally or host it
  anywhere.

## Development

There is no build process. Clone the repo, open `index.html` in a
browser, and edit:

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | Styling (deliberately not the Wordle palette) |
| `words.js` | The curated answer list (`WORDS` array) |
| `solver.js` | Board input, filtering, and suggestion logic |

## Disclaimer

Word5 is an independent hobby tool and is not affiliated with, endorsed
by, or connected to The New York Times or any puzzle publisher.
