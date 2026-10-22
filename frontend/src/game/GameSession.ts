import {
  applyGravity,
  checkForPossibleMoves,
  createAndInitializeBoard,
  findMatches,
  refillBoard,
  selectStageColors,
} from "../utils/gameLogic.ts";
import {
  calculateBonusMoves,
  calculatePoints,
  calculateStageGoals,
  drawMultiplier,
  initialMoves,
  swapCells,
  turnOutcome,
} from "../utils/gameRules.ts";
import type {
  Board,
  Difficulty,
  Position,
  RandomSource,
  StageGoals,
} from "../utils/gameRules.ts";

type Progress =
  | { gameState: "playing" | "gameOver"; nextStageGoals: null }
  | {
      gameState: "stageClear" | "difficultySelect";
      nextStageGoals: StageGoals;
    };
export interface FloatingScore extends Position {
  score: number;
  id: number;
  chainCount: number;
}
export type GameSnapshot = Progress & {
  board: Board;
  selectedColors: number[];
  selectedCell: Position | null;
  moves: number;
  score: number;
  stage: number;
  currentDifficulty: Difficulty;
  currentMaxMoves: number;
  currentTargetScore: number;
  bonusMoves: number;
  cardMultiplier: number;
  cardTurnsLeft: number;
  scoreMultiplier: number;
  isProcessing: boolean;
  floatingScores: FloatingScore[];
};
interface SessionOptions {
  random?: RandomSource;
  createBoard?: (colors: number[], random: RandomSource) => Board;
  onGameOver?: (stage: number) => void;
  onStageCleared?: (stage: number) => void;
}

// Owns one game and its animation tasks. React only subscribes and sends actions.
export class GameSession {
  private state: GameSnapshot;
  private listeners = new Set<() => void>();
  private generation = 0;
  private scoreId = 0;
  private timers = new Map<ReturnType<typeof setTimeout>, () => void>();
  private random: RandomSource;
  private createBoard: NonNullable<SessionOptions["createBoard"]>;
  private initialDifficulty: Difficulty;
  private options: SessionOptions;

  constructor(initialDifficulty: Difficulty, options: SessionOptions = {}) {
    this.initialDifficulty = initialDifficulty;
    this.options = options;
    this.random = options.random ?? Math.random;
    this.createBoard = options.createBoard ?? createAndInitializeBoard;
    this.state = this.initialState();
  }

  private initialState(): GameSnapshot {
    const selectedColors = selectStageColors(this.random);
    return {
      board: this.createBoard(selectedColors, this.random),
      selectedColors,
      selectedCell: null,
      moves: 0,
      score: 0,
      stage: 1,
      currentDifficulty: this.initialDifficulty,
      currentMaxMoves: initialMoves[this.initialDifficulty],
      currentTargetScore: calculateStageGoals(
        1,
        this.initialDifficulty,
        this.random,
      ).targetScore,
      gameState: "playing",
      nextStageGoals: null,
      bonusMoves: 0,
      cardMultiplier: 1,
      cardTurnsLeft: 0,
      scoreMultiplier: 1,
      isProcessing: false,
      floatingScores: [],
    };
  }

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(state: GameSnapshot) {
    this.state = state;
    for (const listener of this.listeners) listener();
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        resolve();
      }, ms);
      this.timers.set(timer, resolve);
    });
  }

  // Invalidate every in-flight operation, including an invalid swap rollback.
  cancel = () => {
    this.generation++;
    for (const [timer, resolve] of this.timers) {
      clearTimeout(timer);
      resolve();
    }
    this.timers.clear();
  };

  resetBoard = () => {
    this.cancel();
    this.update(this.initialState());
  };

  handleProceedToNextStage = () => {
    if (this.state.gameState !== "stageClear") return;
    this.update({ ...this.state, gameState: "difficultySelect" });
  };

  handleDifficultySelected = (difficulty: Difficulty) => {
    const s = this.state;
    if (s.gameState !== "difficultySelect") return;
    const goal = s.nextStageGoals[difficulty];
    this.cancel();
    const selectedColors = selectStageColors(this.random);
    this.update({
      ...s,
      gameState: "playing",
      nextStageGoals: null,
      currentDifficulty: difficulty,
      stage: s.stage + 1,
      currentMaxMoves:
        s.currentMaxMoves - s.moves + goal.addedMoves + s.bonusMoves,
      currentTargetScore: goal.targetScore,
      moves: 0,
      score: 0,
      bonusMoves: 0,
      selectedColors,
      board: this.createBoard(selectedColors, this.random),
      selectedCell: null,
      isProcessing: false,
      floatingScores: [],
      scoreMultiplier: s.cardMultiplier,
    });
  };

  drawCard = () => {
    const s = this.state;
    if (
      s.isProcessing ||
      s.gameState !== "playing" ||
      s.currentMaxMoves - s.moves < 3
    )
      return;
    const multiplier = drawMultiplier(this.random);
    this.update({
      ...s,
      moves: s.moves + 3,
      cardMultiplier: multiplier,
      cardTurnsLeft: 3,
      scoreMultiplier: multiplier,
    });
    this.finishTurn();
  };

  private finishTurn() {
    const s = this.state;
    const result = turnOutcome(
      s.score,
      s.currentTargetScore,
      s.moves,
      s.currentMaxMoves,
    );
    if (result === "stageClear") {
      const nextStageGoals = Object.fromEntries(
        (["easy", "medium", "hard"] as const).map((d) => [
          d,
          calculateStageGoals(s.stage + 1, d, this.random),
        ]),
      ) as StageGoals;
      this.update({
        ...s,
        gameState: result,
        nextStageGoals,
        bonusMoves: calculateBonusMoves(s.score, s.currentTargetScore),
        isProcessing: false,
      });
      this.options.onStageCleared?.(s.stage);
    } else {
      this.update({
        ...s,
        gameState: result,
        nextStageGoals: null,
        isProcessing: false,
      });
      if (result === "gameOver") this.options.onGameOver?.(s.stage);
    }
  }

  selectCell = async (row: number, col: number, speed = 1) => {
    const s = this.state;
    if (
      s.isProcessing ||
      s.gameState !== "playing" ||
      s.board[row]?.[col] == null
    )
      return;
    const selected = s.selectedCell;
    if (
      !selected ||
      Math.abs(selected.row - row) + Math.abs(selected.col - col) !== 1
    ) {
      this.update({
        ...s,
        selectedCell:
          selected?.row === row && selected.col === col ? null : { row, col },
      });
      return;
    }

    const generation = this.generation;
    const active = () => generation === this.generation;
    const delay = 300 / (Number.isFinite(speed) ? Math.max(0.1, speed) : 1);
    let board = swapCells(s.board, selected, { row, col });
    let matches = findMatches(board);
    this.update({ ...s, board, selectedCell: null, isProcessing: true });

    try {
      if (matches.length === 0) {
        await this.wait(delay);
        if (active())
          this.update({
            ...this.state,
            board: s.board,
            selectedCell: null,
            isProcessing: false,
          });
        return;
      }
      this.update({ ...this.state, moves: s.moves + 1 });
      let score = s.score;
      let chain = 0;
      while (matches.length > 0) {
        chain++;
        const points = calculatePoints(
          s.stage,
          matches.length,
          chain,
          s.cardMultiplier,
        );
        score += points;
        const floatingScores = matches.map((position) => ({
          ...position,
          score: Math.floor(points / matches.length),
          id: this.scoreId++,
          chainCount: chain,
        }));
        this.update({
          ...this.state,
          score,
          scoreMultiplier: 2 ** (chain - 1) * s.cardMultiplier,
          floatingScores: [...this.state.floatingScores, ...floatingScores],
        });
        void this.wait(1000).then(() => {
          if (!active()) return;
          const ids = new Set(floatingScores.map((f) => f.id));
          this.update({
            ...this.state,
            floatingScores: this.state.floatingScores.filter(
              (f) => !ids.has(f.id),
            ),
          });
        });
        board = board.map((r) => [...r]);
        for (const { row: r, col: c } of matches) board[r][c] = null;
        this.update({ ...this.state, board });
        await this.wait(delay);
        if (!active()) return;
        board = applyGravity(board);
        this.update({ ...this.state, board });
        await this.wait(delay);
        if (!active()) return;
        board = refillBoard(board, s.selectedColors, this.random);
        this.update({ ...this.state, board });
        await this.wait(delay);
        if (!active()) return;
        matches = findMatches(board);
      }
      const cardTurnsLeft = Math.max(0, s.cardTurnsLeft - 1);
      const cardMultiplier = cardTurnsLeft > 0 ? s.cardMultiplier : 1;
      this.update({
        ...this.state,
        cardTurnsLeft,
        cardMultiplier,
        scoreMultiplier: cardMultiplier,
      });
      this.finishTurn();
      if (this.state.gameState === "playing" && !checkForPossibleMoves(board))
        this.resetBoard();
    } finally {
      if (active() && this.state.isProcessing)
        this.update({ ...this.state, isProcessing: false });
    }
  };
}
