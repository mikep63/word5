// Word5 solver — board input, constraint filtering, and suggestions.
// Filtering is done by re-scoring: a candidate survives a guess row iff
// scoring that guess against the candidate reproduces the user's clue
// pattern exactly. This handles duplicate letters the same way Wordle does.

const ROWS = 6;
const COLS = 5;
const STATES = ["", "absent", "present", "correct"];
const MAX_SHOWN = 500;

const board = document.getElementById("board");
const countHeading = document.getElementById("count-heading");
const suggestionsWrap = document.getElementById("suggestions-wrap");
const suggestionsEl = document.getElementById("suggestions");
const candidatesEl = document.getElementById("candidates");
const overflowNote = document.getElementById("overflow-note");
const resetBtn = document.getElementById("reset-btn");

// ---------- board construction ----------

const tiles = []; // tiles[row][col]

function buildBoard() {
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement("div");
    row.className = "row";
    tiles[r] = [];
    for (let c = 0; c < COLS; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.tabIndex = 0;
      tile.dataset.row = r;
      tile.dataset.col = c;
      tile.dataset.state = "";
      tile.setAttribute("role", "button");
      tile.setAttribute("aria-label", `Row ${r + 1} letter ${c + 1}`);
      tiles[r][c] = tile;
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
}

function tileAt(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS ? tiles[r][c] : null;
}

// ---------- input handling ----------

function setLetter(tile, letter) {
  tile.textContent = letter;
  if (!letter) {
    tile.dataset.state = "";
    tile.classList.remove("absent", "present", "correct");
  }
}

function cycleState(tile) {
  if (!tile.textContent) return;
  const next = STATES[(STATES.indexOf(tile.dataset.state) + 1) % STATES.length];
  tile.dataset.state = next || "absent"; // cycling wraps past the unmarked state
  tile.classList.remove("absent", "present", "correct");
  if (tile.dataset.state) tile.classList.add(tile.dataset.state);
}

board.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  tile.focus();
  if (tile.textContent) {
    cycleState(tile);
    update();
  }
});

board.addEventListener("keydown", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  const r = +tile.dataset.row;
  const c = +tile.dataset.col;

  if (/^[a-zA-Z]$/.test(e.key)) {
    setLetter(tile, e.key.toLowerCase());
    tile.classList.remove("absent", "present", "correct");
    tile.dataset.state = "";
    (tileAt(r, c + 1) || tile).focus();
    update();
    e.preventDefault();
  } else if (e.key === "Backspace") {
    if (tile.textContent) {
      setLetter(tile, "");
    } else {
      const prev = tileAt(r, c - 1);
      if (prev) {
        setLetter(prev, "");
        prev.focus();
      }
    }
    update();
    e.preventDefault();
  } else if (e.key === " " || e.key === "Enter") {
    if (tile.textContent) {
      cycleState(tile);
      update();
    }
    e.preventDefault();
  } else if (e.key === "ArrowRight") {
    (tileAt(r, c + 1) || tile).focus();
    e.preventDefault();
  } else if (e.key === "ArrowLeft") {
    (tileAt(r, c - 1) || tile).focus();
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    (tileAt(r + 1, c) || tile).focus();
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    (tileAt(r - 1, c) || tile).focus();
    e.preventDefault();
  }
});

resetBtn.addEventListener("click", () => {
  for (const row of tiles) {
    for (const tile of row) setLetter(tile, "");
  }
  tiles[0][0].focus();
  update();
});

// ---------- scoring & filtering ----------

// Returns a 5-char pattern of a/p/c for guessing `guess` against `answer`.
function score(guess, answer) {
  const result = ["a", "a", "a", "a", "a"];
  const remaining = {};
  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "c";
    } else {
      remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
  }
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "c") continue;
    const ch = guess[i];
    if (remaining[ch] > 0) {
      result[i] = "p";
      remaining[ch]--;
    }
  }
  return result.join("");
}

const STATE_CODE = { absent: "a", present: "p", correct: "c" };

// A row counts only when all five tiles have a letter and a clue color.
function completedRows() {
  const rows = [];
  for (const row of tiles) {
    let guess = "";
    let pattern = "";
    for (const tile of row) {
      const letter = tile.textContent;
      const code = STATE_CODE[tile.dataset.state];
      if (!letter || !code) {
        guess = null;
        break;
      }
      guess += letter;
      pattern += code;
    }
    if (guess) rows.push({ guess, pattern });
  }
  return rows;
}

function filterCandidates() {
  const rows = completedRows();
  return WORDS.filter((word) =>
    rows.every(({ guess, pattern }) => score(guess, word) === pattern)
  );
}

// ---------- suggestions ----------

// Small candidate pools: pick the guess (from the pool) whose clue patterns
// split the pool into the most evenly distributed groups (max entropy).
// Large pools: fast letter-frequency heuristic favoring common unique letters.
function suggest(candidates) {
  if (candidates.length <= 2) return candidates.slice(0, 1);

  if (candidates.length <= 200) {
    const scored = candidates.map((guess) => {
      const groups = {};
      for (const answer of candidates) {
        const p = score(guess, answer);
        groups[p] = (groups[p] || 0) + 1;
      }
      let entropy = 0;
      for (const key in groups) {
        const p = groups[key] / candidates.length;
        entropy -= p * Math.log2(p);
      }
      return { guess, value: entropy };
    });
    scored.sort((a, b) => b.value - a.value);
    return scored.slice(0, 5).map((s) => s.guess);
  }

  const freq = {};
  for (const word of candidates) {
    for (const ch of new Set(word)) freq[ch] = (freq[ch] || 0) + 1;
  }
  const scored = candidates.map((word) => {
    let value = 0;
    for (const ch of new Set(word)) value += freq[ch];
    return { guess: word, value };
  });
  scored.sort((a, b) => b.value - a.value);
  return scored.slice(0, 5).map((s) => s.guess);
}

// ---------- rendering ----------

function update() {
  const candidates = filterCandidates();
  const anyClues = completedRows().length > 0;

  countHeading.textContent =
    candidates.length === 1
      ? "1 possible word"
      : `${candidates.length.toLocaleString()} possible words`;

  candidatesEl.textContent = "";
  const shown = candidates.slice(0, MAX_SHOWN);
  const frag = document.createDocumentFragment();
  for (const word of shown) {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = word;
    frag.appendChild(span);
  }
  candidatesEl.appendChild(frag);

  if (candidates.length > MAX_SHOWN) {
    overflowNote.textContent = `Showing the first ${MAX_SHOWN} of ${candidates.length.toLocaleString()} words. Add more clues to narrow the list.`;
    overflowNote.hidden = false;
  } else {
    overflowNote.hidden = true;
  }

  if (anyClues && candidates.length > 1) {
    suggestionsEl.textContent = "";
    for (const word of suggest(candidates)) {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      suggestionsEl.appendChild(span);
    }
    suggestionsWrap.hidden = false;
  } else {
    suggestionsWrap.hidden = true;
  }
}

buildBoard();
tiles[0][0].focus();
update();
