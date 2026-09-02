/* =========================================================
   Tetris Classic — script.js
   Lógica completa do jogo em JavaScript puro (ES6+).
   Tudo encapsulado numa IIFE para evitar variáveis globais.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------
   * Constantes
   * ------------------------------------------------------- */
  const COLS = 10;
  const ROWS = 20;
  const BASE_CELL = 28; // px por célula (resolução interna do canvas do tabuleiro)
  const BOARD_PX_W = COLS * BASE_CELL; // 280
  const BOARD_PX_H = ROWS * BASE_CELL; // 560

  const NEXT_CELL = 20; // px por célula na prévia da próxima peça
  const NEXT_GRID = 4; // prévia comporta uma matriz até 4x4
  const NEXT_PX = NEXT_CELL * NEXT_GRID; // 80

  const BASE_DROP_INTERVAL = 1000; // ms — velocidade de queda no nível 1
  const SPEED_STEP = 70; // ms reduzidos a cada nível
  const MIN_DROP_INTERVAL = 120; // ms — velocidade máxima

  const LINE_POINTS = { 1: 100, 2: 300, 3: 500, 4: 800 };
  const COMBO_LABELS = { 1: "Linha!", 2: "Duplo!", 3: "Triplo!", 4: "TETRIS!" };
  const LEVEL_UP_EVERY = 10; // linhas por nível

  const CLEAR_ANIMATION_MS = 300; // duração do flash ao limpar linhas
  const LOCK_FLASH_MS = 150; // duração do feedback ao encaixar peça

  const HIGH_SCORE_KEY = "tetrisClassicHighScore";

  // Formas dos tetrominós representadas em matrizes quadradas,
  // prontas para rotação por transformação de matriz.
  const SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  };

  const COLORS = {
    I: "#4fd1ff",
    O: "#f5d300",
    T: "#b06cff",
    S: "#3ddc84",
    Z: "#ff4d5e",
    J: "#3d7bff",
    L: "#ff9f40",
  };

  // Deslocamentos tentados ao rotacionar, para permitir "wall kicks" simples.
  const ROTATION_KICKS = [0, 1, -1, 2, -2];

  /* ---------------------------------------------------------
   * Preparado para efeitos sonoros futuros (audio.enabled = false)
   * ------------------------------------------------------- */
  const SOUND_ENABLED = false;
  const Sound = {
    play(name) {
      if (!SOUND_ENABLED) return;
      // Espaço reservado: ex. new Audio(`sfx/${name}.mp3`).play().catch(() => {});
    },
  };

  /* ---------------------------------------------------------
   * Referências DOM
   * ------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);

  const boardCanvas = $("board-canvas");
  const boardCtx = boardCanvas.getContext("2d");
  const nextCanvas = $("next-canvas");
  const nextCtx = nextCanvas.getContext("2d");

  const boardWrapper = $("board-wrapper");
  const comboToast = $("combo-toast");
  const srStatus = $("sr-status");

  const startScreen = $("start-screen");
  const pauseOverlay = $("pause-overlay");
  const gameOverOverlay = $("game-over-overlay");

  const scoreEl = $("score");
  const highScoreEl = $("high-score");
  const levelEl = $("level");
  const linesEl = $("lines");
  const finalScoreEl = $("final-score");
  const finalHighScoreEl = $("final-high-score");

  const playBtn = $("play-btn");
  const resumeBtn = $("resume-btn");
  const pauseBtn = $("pause-btn");
  const restartBtn = $("restart-btn");
  const restartBtnOverlay = $("restart-btn-overlay");

  const btnLeft = $("btn-left");
  const btnRight = $("btn-right");
  const btnRotate = $("btn-rotate");
  const btnDown = $("btn-down");
  const btnDrop = $("btn-drop");
  const btnPause = $("btn-pause");

  /* ---------------------------------------------------------
   * Estado do jogo (evita variáveis globais soltas)
   * ------------------------------------------------------- */
  const state = {
    board: createEmptyBoard(),
    bag: [],
    current: null,
    next: null,
    score: 0,
    highScore: loadHighScore(),
    level: 1,
    lines: 0,
    dropInterval: BASE_DROP_INTERVAL,
    dropCounter: 0,
    lastTime: 0,
    phase: "start", // 'start' | 'playing' | 'paused' | 'gameover'
    animating: false,
    clearingRows: [],
    clearFlashStart: 0,
    lockFlash: null,
  };

  /* ---------------------------------------------------------
   * Tabuleiro
   * ------------------------------------------------------- */
  function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  }

  function getFullRows() {
    const rows = [];
    for (let y = 0; y < ROWS; y++) {
      if (state.board[y].every((cell) => cell !== 0)) rows.push(y);
    }
    return rows;
  }

  function removeRows(rows) {
    const rowsSet = new Set(rows);
    const remaining = state.board.filter((_, idx) => !rowsSet.has(idx));
    const removedCount = ROWS - remaining.length;
    const newRows = Array.from({ length: removedCount }, () => new Array(COLS).fill(0));
    state.board = newRows.concat(remaining);
  }

  /* ---------------------------------------------------------
   * Peças
   * ------------------------------------------------------- */
  function refillBag() {
    const bag = ["I", "O", "T", "S", "Z", "J", "L"];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }

  function nextTypeFromBag() {
    if (state.bag.length === 0) state.bag = refillBag();
    return state.bag.pop();
  }

  function createPiece(type) {
    const matrix = SHAPES[type].map((row) => row.slice());
    return {
      type,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: 0,
    };
  }

  // Rotação 90° horária de uma matriz quadrada NxN.
  function rotateMatrix(matrix) {
    const n = matrix.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push([]);
      for (let j = 0; j < n; j++) {
        result[i][j] = matrix[n - 1 - j][i];
      }
    }
    return result;
  }

  /* ---------------------------------------------------------
   * Colisão
   * ------------------------------------------------------- */
  function collide(board, piece, offsetX, offsetY, matrix) {
    const m = matrix || piece.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (!m[y][x]) continue;
        const boardX = piece.x + x + offsetX;
        const boardY = piece.y + y + offsetY;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
        if (boardY >= 0 && board[boardY][boardX]) return true;
      }
    }
    return false;
  }

  function computeGhostY() {
    let offset = 0;
    while (!collide(state.board, state.current, 0, offset + 1)) offset++;
    return state.current.y + offset;
  }

  /* ---------------------------------------------------------
   * Movimentos e ações do jogador
   * ------------------------------------------------------- */
  function canAct() {
    return state.phase === "playing" && !state.animating;
  }

  function moveHorizontal(dir) {
    if (!canAct()) return;
    if (!collide(state.board, state.current, dir, 0)) {
      state.current.x += dir;
      Sound.play("move");
    }
  }

  function softDrop() {
    if (!canAct()) return;
    if (!collide(state.board, state.current, 0, 1)) {
      state.current.y += 1;
      state.score += 1;
      updateHUD();
      Sound.play("move");
    } else {
      lockPiece();
    }
    state.dropCounter = 0;
  }

  function hardDrop() {
    if (!canAct()) return;
    let dist = 0;
    while (!collide(state.board, state.current, 0, dist + 1)) dist++;
    state.current.y += dist;
    state.score += dist * 2;
    updateHUD();
    Sound.play("drop");
    lockPiece();
  }

  function rotatePiece() {
    if (!canAct()) return;
    const rotated = rotateMatrix(state.current.matrix);
    for (const kick of ROTATION_KICKS) {
      if (!collide(state.board, state.current, kick, 0, rotated)) {
        state.current.matrix = rotated;
        state.current.x += kick;
        Sound.play("rotate");
        return;
      }
    }
    // Nenhum kick funcionou: rotação bloqueada, peça permanece como está.
  }

  // Queda automática (gravidade), chamada pelo loop principal.
  function dropPiece() {
    if (!collide(state.board, state.current, 0, 1)) {
      state.current.y += 1;
    } else {
      lockPiece();
    }
    state.dropCounter = 0;
  }

  /* ---------------------------------------------------------
   * Fixação da peça, limpeza de linhas e pontuação
   * ------------------------------------------------------- */
  function mergePieceToBoard() {
    const { matrix, x, y, type } = state.current;
    for (let ry = 0; ry < matrix.length; ry++) {
      for (let rx = 0; rx < matrix[ry].length; rx++) {
        if (!matrix[ry][rx]) continue;
        const boardY = y + ry;
        const boardX = x + rx;
        if (boardY < 0) continue; // acima da área visível (área de spawn)
        state.board[boardY][boardX] = type;
      }
    }
  }

  function triggerLockFlash() {
    const { matrix, x, y } = state.current;
    const cells = [];
    for (let ry = 0; ry < matrix.length; ry++) {
      for (let rx = 0; rx < matrix[ry].length; rx++) {
        if (matrix[ry][rx]) cells.push([x + rx, y + ry]);
      }
    }
    state.lockFlash = { cells, start: performance.now() };
  }

  function lockPiece() {
    mergePieceToBoard();
    triggerLockFlash();
    Sound.play("lock");

    const fullRows = getFullRows();
    if (fullRows.length > 0) {
      state.animating = true;
      state.clearingRows = fullRows;
      state.clearFlashStart = performance.now();
      showCombo(fullRows.length);
      Sound.play("clear");
      setTimeout(() => {
        removeRows(fullRows);
        applyScore(fullRows.length);
        state.clearingRows = [];
        state.animating = false;
        spawnNext();
      }, CLEAR_ANIMATION_MS);
    } else {
      spawnNext();
    }
  }

  function applyScore(lineCount) {
    state.score += LINE_POINTS[lineCount] || 0;
    state.lines += lineCount;

    const newLevel = Math.floor(state.lines / LEVEL_UP_EVERY) + 1;
    if (newLevel !== state.level) {
      state.level = newLevel;
      state.dropInterval = Math.max(MIN_DROP_INTERVAL, BASE_DROP_INTERVAL - (newLevel - 1) * SPEED_STEP);
      announce(`Nível ${state.level}!`);
    }
    updateHUD();
  }

  function spawnNext() {
    state.current = state.next;
    state.next = createPiece(nextTypeFromBag());
    drawNextPreview();

    if (collide(state.board, state.current, 0, 0)) {
      triggerGameOver();
    }
  }

  /* ---------------------------------------------------------
   * Estados do jogo: início, pausa, reinício, game over
   * ------------------------------------------------------- */
  function resetState() {
    state.board = createEmptyBoard();
    state.bag = [];
    state.current = createPiece(nextTypeFromBag());
    state.next = createPiece(nextTypeFromBag());
    state.score = 0;
    state.level = 1;
    state.lines = 0;
    state.dropInterval = BASE_DROP_INTERVAL;
    state.dropCounter = 0;
    state.animating = false;
    state.clearingRows = [];
    state.lockFlash = null;
    state.lastTime = performance.now();
    drawNextPreview();
    updateHUD();
  }

  function startGame() {
    resetState();
    state.phase = "playing";
    startScreen.classList.add("hidden");
    pauseOverlay.classList.add("hidden");
    gameOverOverlay.classList.add("hidden");
    announce("Jogo iniciado");
  }

  function restartGame() {
    startGame();
  }

  function togglePause() {
    if (state.phase === "playing") {
      state.phase = "paused";
      pauseOverlay.classList.remove("hidden");
      announce("Jogo pausado");
    } else if (state.phase === "paused") {
      state.phase = "playing";
      pauseOverlay.classList.add("hidden");
      state.lastTime = performance.now();
      announce("Jogo retomado");
    }
  }

  function triggerGameOver() {
    state.phase = "gameover";

    if (state.score > state.highScore) {
      state.highScore = state.score;
      saveHighScore(state.highScore);
    }

    finalScoreEl.textContent = state.score;
    finalHighScoreEl.textContent = state.highScore;
    updateHUD();

    gameOverOverlay.classList.remove("hidden");
    boardWrapper.classList.add("flash-gameover");
    setTimeout(() => boardWrapper.classList.remove("flash-gameover"), 600);

    Sound.play("gameover");
    announce(`Fim de jogo. Pontuação ${state.score}.`);
  }

  /* ---------------------------------------------------------
   * HUD, recorde (localStorage) e acessibilidade
   * ------------------------------------------------------- */
  function updateHUD() {
    scoreEl.textContent = state.score;
    highScoreEl.textContent = state.highScore;
    levelEl.textContent = state.level;
    linesEl.textContent = state.lines;
  }

  function loadHighScore() {
    try {
      const value = localStorage.getItem(HIGH_SCORE_KEY);
      return value ? parseInt(value, 10) || 0 : 0;
    } catch (err) {
      return 0;
    }
  }

  function saveHighScore(value) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch (err) {
      // localStorage indisponível (ex.: modo privado) — ignora silenciosamente.
    }
  }

  function announce(message) {
    srStatus.textContent = message;
  }

  function showCombo(lineCount) {
    const label = COMBO_LABELS[lineCount];
    if (!label) return;
    comboToast.textContent = label;
    comboToast.classList.remove("show");
    void comboToast.offsetWidth; // força reflow para reiniciar a animação
    comboToast.classList.add("show");
    announce(`${label} +${LINE_POINTS[lineCount]} pontos`);
  }

  /* ---------------------------------------------------------
   * Renderização (Canvas)
   * ------------------------------------------------------- */
  function setupHiDPICanvas(canvas, ctx, width, height) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawCellAt(ctx, px, py, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);

    // Realce sutil no topo (efeito de bloco/bisel suave).
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(px, py, size, Math.max(2, size * 0.12));

    // Sombra sutil na base.
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(px, py + size - Math.max(2, size * 0.12), size, Math.max(2, size * 0.12));

    // Borda discreta.
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
  }

  function drawBoardBackground() {
    boardCtx.fillStyle = "#02030a";
    boardCtx.fillRect(0, 0, BOARD_PX_W, BOARD_PX_H);
  }

  function drawGrid() {
    boardCtx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    boardCtx.lineWidth = 1;
    boardCtx.beginPath();
    for (let x = 1; x < COLS; x++) {
      boardCtx.moveTo(x * BASE_CELL + 0.5, 0);
      boardCtx.lineTo(x * BASE_CELL + 0.5, BOARD_PX_H);
    }
    for (let y = 1; y < ROWS; y++) {
      boardCtx.moveTo(0, y * BASE_CELL + 0.5);
      boardCtx.lineTo(BOARD_PX_W, y * BASE_CELL + 0.5);
    }
    boardCtx.stroke();
  }

  function drawLockedCells() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = state.board[y][x];
        if (cell) drawCellAt(boardCtx, x * BASE_CELL, y * BASE_CELL, BASE_CELL, COLORS[cell]);
      }
    }
  }

  function drawPieceMatrix(ctx, matrix, x, y, color, cellSize) {
    for (let ry = 0; ry < matrix.length; ry++) {
      for (let rx = 0; rx < matrix[ry].length; rx++) {
        if (!matrix[ry][rx]) continue;
        const py = y + ry;
        if (py < 0) continue;
        drawCellAt(ctx, (x + rx) * cellSize, py * cellSize, cellSize, color);
      }
    }
  }

  function drawGhost() {
    const ghostY = computeGhostY();
    if (ghostY === state.current.y) return; // peça já está apoiada, sem necessidade de fantasma
    boardCtx.save();
    boardCtx.globalAlpha = 0.22;
    drawPieceMatrix(boardCtx, state.current.matrix, state.current.x, ghostY, COLORS[state.current.type], BASE_CELL);
    boardCtx.restore();
  }

  function drawClearFlash() {
    const elapsed = performance.now() - state.clearFlashStart;
    const alpha = Math.max(0, 0.45 + 0.45 * Math.sin(elapsed / 40));
    boardCtx.save();
    boardCtx.globalAlpha = alpha;
    boardCtx.fillStyle = "#ffffff";
    state.clearingRows.forEach((y) => {
      boardCtx.fillRect(0, y * BASE_CELL, BOARD_PX_W, BASE_CELL);
    });
    boardCtx.restore();
  }

  function drawLockFlash() {
    const elapsed = performance.now() - state.lockFlash.start;
    if (elapsed >= LOCK_FLASH_MS) {
      state.lockFlash = null;
      return;
    }
    const alpha = 0.35 * (1 - elapsed / LOCK_FLASH_MS);
    boardCtx.save();
    boardCtx.globalAlpha = alpha;
    boardCtx.fillStyle = "#ffffff";
    state.lockFlash.cells.forEach(([x, y]) => {
      if (y < 0) return;
      boardCtx.fillRect(x * BASE_CELL, y * BASE_CELL, BASE_CELL, BASE_CELL);
    });
    boardCtx.restore();
  }

  function render() {
    drawBoardBackground();
    drawGrid();
    drawLockedCells();

    if (state.current && state.phase === "playing" && !state.animating) {
      drawGhost();
      drawPieceMatrix(boardCtx, state.current.matrix, state.current.x, state.current.y, COLORS[state.current.type], BASE_CELL);
    }

    if (state.animating && state.clearingRows.length) {
      drawClearFlash();
    }

    if (state.lockFlash) {
      drawLockFlash();
    }
  }

  function drawNextPreview() {
    nextCtx.clearRect(0, 0, NEXT_PX, NEXT_PX);
    if (!state.next) return;
    const { matrix, type } = state.next;
    const size = matrix.length;
    const offset = ((NEXT_GRID - size) / 2) * NEXT_CELL;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!matrix[y][x]) continue;
        drawCellAt(nextCtx, offset + x * NEXT_CELL, offset + y * NEXT_CELL, NEXT_CELL, COLORS[type]);
      }
    }
  }

  /* ---------------------------------------------------------
   * Loop principal
   * ------------------------------------------------------- */
  function loop(time) {
    const delta = time - state.lastTime;
    state.lastTime = time;

    if (state.phase === "playing" && !state.animating) {
      state.dropCounter += delta;
      if (state.dropCounter >= state.dropInterval) {
        dropPiece();
      }
    }

    render();
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------
   * Entrada: teclado
   * ------------------------------------------------------- */
  const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyP", "KeyR"]);

  window.addEventListener(
    "keydown",
    (e) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();

      switch (e.code) {
        case "KeyR":
          if (e.repeat) return;
          restartGame();
          return;
        case "KeyP":
          if (e.repeat) return;
          togglePause();
          return;
        case "ArrowLeft":
          moveHorizontal(-1);
          return;
        case "ArrowRight":
          moveHorizontal(1);
          return;
        case "ArrowUp":
          if (e.repeat) return;
          rotatePiece();
          return;
        case "ArrowDown":
          softDrop();
          return;
        case "Space":
          if (e.repeat) return;
          hardDrop();
          return;
        default:
          return;
      }
    },
    { passive: false }
  );

  // Evita que o toque na área do jogo role a página durante a partida.
  document.addEventListener(
    "touchmove",
    (e) => {
      if (state.phase === "playing") e.preventDefault();
    },
    { passive: false }
  );

  /* ---------------------------------------------------------
   * Entrada: botões (clique e toque)
   * ------------------------------------------------------- */
  function bindTap(el, handler) {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      handler();
      el.blur();
    });
  }

  // Botões que repetem a ação enquanto pressionados (mover/descer).
  function bindHold(el, handler, interval) {
    let timer = null;
    const start = (e) => {
      e.preventDefault();
      handler();
      clearInterval(timer);
      timer = setInterval(handler, interval);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchend", stop);
    el.addEventListener("touchcancel", stop);
    el.addEventListener("mousedown", start);
    el.addEventListener("mouseup", stop);
    el.addEventListener("mouseleave", stop);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  bindTap(playBtn, startGame);
  bindTap(resumeBtn, togglePause);
  bindTap(pauseBtn, togglePause);
  bindTap(restartBtn, restartGame);
  bindTap(restartBtnOverlay, restartGame);

  bindHold(btnLeft, () => moveHorizontal(-1), 110);
  bindHold(btnRight, () => moveHorizontal(1), 110);
  bindHold(btnDown, softDrop, 90);
  bindTap(btnRotate, rotatePiece);
  bindTap(btnDrop, hardDrop);
  bindTap(btnPause, togglePause);

  /* ---------------------------------------------------------
   * Inicialização
   * ------------------------------------------------------- */
  function setupCanvases() {
    setupHiDPICanvas(boardCanvas, boardCtx, BOARD_PX_W, BOARD_PX_H);
    setupHiDPICanvas(nextCanvas, nextCtx, NEXT_PX, NEXT_PX);
    render();
    drawNextPreview();
  }

  function init() {
    setupCanvases();
    resetState();
    updateHUD();
    window.addEventListener("resize", setupCanvases);
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  init();
})();
