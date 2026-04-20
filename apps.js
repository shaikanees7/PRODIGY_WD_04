(function () {
  "use strict";

  const PLAYERS = { X: "X", O: "O" };
  const EMPTY = null;

  const WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const boardEl = document.getElementById("board");
  const cells = Array.from(boardEl.querySelectorAll(".cell"));
  const statusEl = document.getElementById("status");
  const modePvpBtn = document.getElementById("mode-pvp");
  const modePvcBtn = document.getElementById("mode-pvc");
  const modeHintEl = document.getElementById("mode-hint");
  const newGameBtn = document.getElementById("btn-new-game");

  /** @type {('pvp'|'pvc')} */
  let mode = "pvp";
  /** @type {(null|'X'|'O')[]} */
  let board = Array(9).fill(EMPTY);
  /** @type {'X'|'O'} */
  let current = PLAYERS.X;
  let gameOver = false;
  /** @type {number[]|null} */
  let winningLine = null;

  function isVsComputer() {
    return mode === "pvc";
  }

  function humanIsX() {
    return true;
  }

  function getComputerMark() {
    return humanIsX() ? PLAYERS.O : PLAYERS.X;
  }

  function getHumanMark() {
    return humanIsX() ? PLAYERS.X : PLAYERS.O;
  }

  function checkWinner(b) {
    for (const line of WIN_LINES) {
      const [a, c, d] = line;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], line };
      }
    }
    return null;
  }

  function isBoardFull(b) {
    return b.every((cell) => cell !== EMPTY);
  }

  function updateCellAria(index, mark) {
    const cell = cells[index];
    const n = index + 1;
    if (mark) {
      cell.setAttribute("aria-label", `Cell ${n}, ${mark}`);
    } else {
      cell.setAttribute("aria-label", `Cell ${n} empty`);
    }
  }

  function renderBoard() {
    cells.forEach((cell, i) => {
      const mark = board[i];
      cell.textContent = mark || "";
      cell.classList.remove("mark-x", "mark-o", "winning");
      if (mark === PLAYERS.X) cell.classList.add("mark-x");
      if (mark === PLAYERS.O) cell.classList.add("mark-o");
      if (winningLine && winningLine.includes(i)) {
        cell.classList.add("winning");
      }
      cell.disabled = gameOver || mark !== EMPTY;
      updateCellAria(i, mark);
    });
  }

  function setStatusMessage() {
    statusEl.classList.remove("is-win", "is-draw");
    if (gameOver) {
      if (winningLine) {
        const w = board[winningLine[0]];
        const label =
          isVsComputer() && w === getComputerMark()
            ? "Computer wins."
            : isVsComputer() && w === getHumanMark()
              ? "You win!"
              : `${w} wins!`;
        statusEl.textContent = label;
        statusEl.classList.add("is-win");
      } else {
        statusEl.textContent = "Draw — board full.";
        statusEl.classList.add("is-draw");
      }
      return;
    }
    if (isVsComputer()) {
      if (current === getHumanMark()) {
        statusEl.textContent = "Your turn (X)";
      } else {
        statusEl.textContent = "Computer thinking…";
      }
    } else {
      statusEl.textContent = `${current}’s turn`;
    }
  }

  function endGame(winnerResult) {
    gameOver = true;
    winningLine = winnerResult ? winnerResult.line : null;
    renderBoard();
    setStatusMessage();
  }

  function applyMove(index, mark) {
    board[index] = mark;
    const result = checkWinner(board);
    if (result) {
      endGame(result);
      return;
    }
    if (isBoardFull(board)) {
      endGame(null);
      return;
    }
    current = mark === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
    renderBoard();
    setStatusMessage();
  }

  /** Minimax: computer is `aiMark`, human is `humanMark` */
  function minimax(b, isMaximizing, aiMark, humanMark) {
    const win = checkWinner(b);
    if (win) {
      if (win.winner === aiMark) return { score: 10 };
      if (win.winner === humanMark) return { score: -10 };
    }
    if (isBoardFull(b)) return { score: 0 };

    if (isMaximizing) {
      let best = -Infinity;
      let bestMove = -1;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== EMPTY) continue;
        b[i] = aiMark;
        const { score } = minimax(b, false, aiMark, humanMark);
        b[i] = EMPTY;
        if (score > best) {
          best = score;
          bestMove = i;
        }
      }
      return { score: best, index: bestMove };
    }
    let best = Infinity;
    let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (b[i] !== EMPTY) continue;
      b[i] = humanMark;
      const { score } = minimax(b, true, aiMark, humanMark);
      b[i] = EMPTY;
      if (score < best) {
        best = score;
        bestMove = i;
      }
    }
    return { score: best, index: bestMove };
  }

  function getComputerMove() {
    const aiMark = getComputerMark();
    const humanMark = getHumanMark();
    const copy = board.slice();
    const { index } = minimax(copy, true, aiMark, humanMark);
    return index >= 0 ? index : copy.findIndex((c) => c === EMPTY);
  }

  function scheduleComputerMove() {
    window.setTimeout(() => {
      if (gameOver || current !== getComputerMark()) return;
      const move = getComputerMove();
      if (move >= 0 && board[move] === EMPTY) {
        applyMove(move, getComputerMark());
      }
    }, 280);
  }

  function handleCellClick(index) {
    if (gameOver) return;
    if (board[index] !== EMPTY) return;
    if (isVsComputer() && current !== getHumanMark()) return;

    applyMove(index, current);

    if (!gameOver && isVsComputer() && current === getComputerMark()) {
      scheduleComputerMove();
    }
  }

  function setMode(next) {
    mode = next;
    const isPvp = mode === "pvp";
    modePvpBtn.classList.toggle("is-active", isPvp);
    modePvcBtn.classList.toggle("is-active", !isPvp);
    modePvpBtn.setAttribute("aria-pressed", String(isPvp));
    modePvcBtn.setAttribute("aria-pressed", String(!isPvp));
    modeHintEl.textContent = isPvp
      ? "You are X, friend is O. X goes first."
      : "You are X; the computer plays O and uses the best reply. You move first.";
    resetGame();
  }

  function resetGame() {
    board = Array(9).fill(EMPTY);
    current = PLAYERS.X;
    gameOver = false;
    winningLine = null;
    renderBoard();
    setStatusMessage();
    if (!gameOver && isVsComputer() && current === getComputerMark()) {
      scheduleComputerMove();
    }
  }

  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const i = Number(cell.dataset.index);
      handleCellClick(i);
    });
  });

  modePvpBtn.addEventListener("click", () => setMode("pvp"));
  modePvcBtn.addEventListener("click", () => setMode("pvc"));
  newGameBtn.addEventListener("click", resetGame);

  resetGame();
})();
