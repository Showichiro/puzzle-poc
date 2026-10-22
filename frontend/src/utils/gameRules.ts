export type Difficulty = "easy" | "medium" | "hard";
export type Board = Array<Array<number | null>>;
export interface Position {
  row: number;
  col: number;
}
export interface StageGoal {
  addedMoves: number;
  targetScore: number;
}
export type StageGoals = Record<Difficulty, StageGoal>;
export type RandomSource = () => number;

export const initialMoves: Record<Difficulty, number> = {
  easy: 5,
  medium: 30,
  hard: 20,
};

export function calculateStageGoals(
  stage: number,
  difficulty: Difficulty,
  random: RandomSource = Math.random,
): StageGoal {
  const movesRange = { easy: [0, 0], medium: [-1, 1], hard: [-1, 2] };
  const scoreRange = {
    easy: [-1000, 5000],
    medium: [-5000, 20000],
    hard: [-20000, 40000],
  };
  const added = { easy: 1, medium: 3, hard: 5 };
  const multiplier = { easy: 0.8, medium: 1.7, hard: 10 };
  const between = ([min, max]: number[]) =>
    Math.floor(random() * (max - min + 1) + min);
  const addedMoves = Math.max(
    0,
    added[difficulty] + between(movesRange[difficulty]),
  );
  const targetScore =
    stage === 1
      ? 150000
      : Math.max(
          100000,
          Math.floor(100000 * multiplier[difficulty] * 1.5 ** (stage - 1)) +
            between(scoreRange[difficulty]),
        );
  return { addedMoves, targetScore };
}

export function calculatePoints(
  stage: number,
  count: number,
  chain: number,
  multiplier: number,
) {
  return Math.floor(
    (10 + (stage - 1) * 5) * count ** 1.5 * 2 ** (chain - 1) * multiplier,
  );
}

export function calculateBonusMoves(score: number, target: number) {
  return target > 0 && score > target
    ? Math.floor((score / target - 1) ** 0.1 * 3)
    : 0;
}

export function turnOutcome(
  score: number,
  target: number,
  moves: number,
  maxMoves: number,
) {
  if (score >= target) return "stageClear";
  if (moves >= maxMoves) return "gameOver";
  return "playing";
}

export function drawMultiplier(random: RandomSource = Math.random) {
  return Number.parseFloat(Math.exp(random() * Math.log(1000)).toFixed(2));
}

export function swapCells(board: Board, a: Position, b: Position): Board {
  const result = board.map((row) => [...row]);
  [result[a.row][a.col], result[b.row][b.col]] = [
    result[b.row][b.col],
    result[a.row][a.col],
  ];
  return result;
}
