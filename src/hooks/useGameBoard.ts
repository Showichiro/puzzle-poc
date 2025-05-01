import { useRef, useState } from "react";
import {
  applyGravity,
  checkForPossibleMoves,
  createAndInitializeBoard,
  findMatches,
  refillBoard,
  selectStageColors,
} from "../utils/gameLogic";
import { useAnimationSpeed } from "../contexts/AnimationSpeedContext"; // AnimationSpeedContext をインポート
import { saveGameHistory } from "../utils/saveGameHistory";
import { useHighestScore } from "../contexts/HighestScoreContext";

// Difficulty 型を定義
type Difficulty = "easy" | "medium" | "hard";

// ゲームの状態を定義
type GameState =
  | "playing"
  | "stageClear"
  | "difficultySelect"
  | "gameOver";
// ★ ステージ1の初期手数を定義
const initialMovesMap: Record<Difficulty, number> = {
  easy: 5,
  medium: 30,
  hard: 20,
};

// ★ ステージクリア時の加算手数と目標スコアを計算する関数に変更
const calculateStageGoals = (
  stage: number, // 計算対象のステージ (次のステージ)
  difficulty: Difficulty, // 次のステージの難易度
): { addedMoves: number; targetScore: number } => {
  // 難易度ごとのランダム変動幅を定義
  const addedMovesRange: Record<Difficulty, [number, number]> = {
    easy: [-1, 2], // -1から+1の範囲で変動
    medium: [-3, 4],
    hard: [-3, 6],
  };
  const targetScoreRange: Record<Difficulty, [number, number]> = {
    easy: [-1000, 5000], // -5000から+5000の範囲で変動
    medium: [-5000, 20000],
    hard: [-20000, 40000],
  };

  // 難易度に応じたステージクリア時の加算手数
  const addedMovesMap: Record<Difficulty, number> = {
    easy: 1,
    medium: 2,
    hard: 4,
  };

  // ★ 加算手数はステージや難易度で固定とする (シンプル化のため)
  let addedMoves = addedMovesMap[difficulty];
  // ランダムな変動を加える
  const [minMoves, maxMoves] = addedMovesRange[difficulty];
  addedMoves += Math.floor(
    Math.random() * (maxMoves - minMoves + 1) + minMoves,
  );
  // 最小値を0とする
  addedMoves = Math.max(0, addedMoves);

  const baseTargetScore = 100000;
  // 難易度に応じた目標スコア倍率
  const scoreMultiplierMap: Record<Difficulty, number> = {
    easy: 0.9,
    medium: 1.7,
    hard: 3.1,
  };

  // ★ 難易度に応じたスコア倍率を取得
  const difficultyScoreMultiplier = scoreMultiplierMap[difficulty];

  // ★ 目標スコアの計算ロジックは維持 (ステージに応じて増加)
  const scoreMultiplierPerStage = 1.5;
  let targetScore = stage === 1 ? 150000 : Math.floor(
    baseTargetScore *
      difficultyScoreMultiplier *
      Math.pow(scoreMultiplierPerStage, stage - 1), // stage は次のステージ番号なのでそのまま使う
  );
  // ランダムな変動を加える
  if (stage > 1) {
    const [minScore, maxScore] = targetScoreRange[difficulty];
    targetScore += Math.floor(
      Math.random() * (maxScore - minScore + 1) + minScore,
    );
    // 最小値を0とする
    targetScore = Math.max(baseTargetScore, targetScore);
  }
  // ★ addedMoves と targetScore を返す
  return { addedMoves, targetScore };
};

const useGameBoard = (initialDifficulty: Difficulty) => {
  const { speed } = useAnimationSpeed(); // アニメーション速度を取得

  // ★ useState の初期化関数内で色選択と盤面生成を行う
  const [board, setBoard] = useState<Array<Array<number | null>>>(() => {
    selectStageColors(); // まず色を選択
    return createAndInitializeBoard(); // 共通関数で盤面を生成・初期化
  });
  // 手数を管理
  const [moves, setMoves] = useState(0);
  // 選択中のセルを管理
  const [selectedCell, setSelectedCell] = useState<
    {
      row: number;
      col: number;
    } | null
  >(null);
  // 操作中フラグ(連鎖中の誤操作防止)
  const [isProcessing, setIsProcessing] = useState(false);
  // スコア
  const [score, setScore] = useState(0);
  // ステージレベル
  const [stage, setStage] = useState(1); // 現在のステージレベル
  // ★ 現在の目標 (初期値は stage 1 の初期手数と目標スコア)
  const initialTargetScore = calculateStageGoals(
    1,
    initialDifficulty,
  ).targetScore; // Stage 1 の目標スコアのみ計算
  const [currentMaxMoves, setCurrentMaxMoves] = useState(
    initialMovesMap[initialDifficulty],
  ); // ★ Stage 1 の初期手数
  const [currentTargetScore, setCurrentTargetScore] = useState(
    initialTargetScore,
  ); // ★ Stage 1 の目標スコア
  // ゲームの状態を管理する state
  const [gameState, setGameState] = useState<GameState>("playing");

  // ★ 次のステージの難易度ごとの目標 (加算手数と目標スコア)
  const [nextStageGoals, setNextStageGoals] = useState<
    Record<
      Difficulty,
      // ★ 型定義を calculateStageGoals の戻り値に合わせる
      { addedMoves: number; targetScore: number }
    > | null
  >(null);
  // ★ ボーナス手数
  const [bonusMoves, setBonusMoves] = useState(0);
  // スコア倍率
  const [scoreMultiplier, setScoreMultiplier] = useState(1); // 初期値は1倍
  // 加算スコア表示用 state
  const [floatingScores, setFloatingScores] = useState<
    {
      row: number;
      col: number;
      score: number;
      id: number;
      chainCount: number;
    }[] // chainCount を追加
  >([]);
  const scoreIdCounter = useRef(0); // floating score にユニークIDを付与するためのカウンター
  const { setHighestStage } = useHighestScore();
  // カード効果の状態
  const [cardMultiplier, setCardMultiplier] = useState(1); // カードによるスコア倍率 (初期値1)
  const [cardTurnsLeft, setCardTurnsLeft] = useState(0); // カード効果の残りターン数 (初期値0)

  // ステージクリアをチェックする関数
  const checkStageClear = (currentScore: number) => {
    // ステージクリア済み、ゲームオーバー、難易度選択中、ステージクリアモーダル表示中はチェックしない
    if (gameState !== "playing") {
      return;
    }

    if (currentScore >= currentTargetScore) {
      // ステージクリア！
      setGameState("stageClear");
      console.log(`Stage ${stage} Clear! Score: ${currentScore}`);

      // ボーナス手数を計算
      const scoreRatio = currentTargetScore > 0
        ? currentScore / currentTargetScore
        : 0;
      let calculatedBonusMoves = 0;
      if (scoreRatio > 1.0) {
        // ★ 超過スコアの割合に応じて逓減する計算式に変更 (例: 平方根に比例)
        const excessRatio = scoreRatio - 1.0; // 超過した割合 (例: スコアが目標の1.5倍なら 0.5)
        // 計算式例: (超過割合)^0.5 * 10
        calculatedBonusMoves = Math.floor(Math.pow(excessRatio, 0.1) * 3);
      }
      // ★ 上限を撤廃
      setBonusMoves(calculatedBonusMoves);
      // ★ 難易度選択ではなく、ステージクリアモーダルを表示
      setGameState("stageClear");
      // 次のステージの目標計算はここで行う
      const nextStage = stage + 1;
      // ★ 次のステージの目標計算 (calculateStageGoals は difficulty が必須になった)
      setNextStageGoals({
        easy: calculateStageGoals(nextStage, "easy"),
        medium: calculateStageGoals(nextStage, "medium"),
        hard: calculateStageGoals(nextStage, "hard"),
      });
      setHighestStage(stage);
    }
  };

  // ゲームオーバーをチェックする関数
  const checkGameOver = (currentMoves: number, currentScore: number) => {
    // ステージクリア済み、ゲームオーバー、難易度選択中、ステージクリアモーダル表示中はチェックしない
    if (gameState !== "playing") {
      return;
    }
    // ステージクリアしておらず、かつ手数が上限に達していたらゲームオーバー判定
    if (currentMoves >= currentMaxMoves) {
      console.log(
        `Game Over - Stage ${stage}. Moves: ${currentMoves}, Score: ${currentScore}, Target: ${currentTargetScore}`,
      );
      saveGameHistory(stage);
      setGameState("gameOver");
    }
  };

  // ★ ステージクリアモーダルから難易度選択へ進む関数
  const handleProceedToNextStage = () => {
    setGameState("difficultySelect"); // 難易度選択モーダルを表示
  };

  // 難易度選択後に次のステージに進む関数
  const handleDifficultySelected = (selectedDifficulty: Difficulty) => {
    // モーダル非表示と目標情報のリセット
    setGameState("playing");
    setNextStageGoals(null);

    // 次のステージの色を選択し、ステージ番号を更新
    selectStageColors();
    const nextStage = stage + 1;
    console.log(
      `Advancing to Stage ${nextStage} with difficulty: ${selectedDifficulty}`,
    );
    setStage(nextStage);

    // 次のステージの目標を設定
    if (!nextStageGoals) {
      console.error("nextStageGoals is null. Resetting board.");
      resetBoard();
      return;
    }
    const nextGoal = nextStageGoals[selectedDifficulty];
    const remainingMoves = currentMaxMoves - moves;
    const newMaxMoves = remainingMoves + nextGoal.addedMoves + bonusMoves;
    setCurrentMaxMoves(newMaxMoves);
    setCurrentTargetScore(nextGoal.targetScore);

    // 各種stateのリセット
    setMoves(0);
    setScore(0); // スコアはリセット
    setBonusMoves(0);
    setNextStageGoals(null); // 目標情報もリセット
    // 新しい盤面の生成と設定
    const newBoard = createAndInitializeBoard();
    setBoard(newBoard);
  };

  // 盤面リセット関数 (ゲーム開始時、リトライ時)
  const resetBoard = () => {
    // ステージ色の選択とブロックタイプのリセット
    selectStageColors();
    // resetBlockTypes(); // 空だが念のため呼ぶ - 削除

    // 初期盤面の生成と設定
    const initialBoard = createAndInitializeBoard();
    setBoard(initialBoard);

    // 各種stateの初期化 (Stage 1)
    setStage(1);
    const initialResetTargetScore = calculateStageGoals(
      1,
      initialDifficulty,
    ).targetScore;
    setCurrentMaxMoves(initialMovesMap[initialDifficulty]);
    setCurrentTargetScore(initialResetTargetScore);

    setMoves(0);
    setScore(0);
    setGameState("playing");
    setNextStageGoals(null);
    setBonusMoves(0);
    setScoreMultiplier(1);
    setFloatingScores([]);
    scoreIdCounter.current = 0;
    // カード効果もリセット
    setCardMultiplier(1);
    setCardTurnsLeft(0);
  };

  // ★ カードを引く関数
  const drawCard = () => {
    console.log("drawCard function called."); // ★ デバッグログ追加
    // 手数が3未満、処理中、ゲームオーバー、ステージクリア中などは引けない
    const remainingMoves = currentMaxMoves - moves; // ★ 残り手数を計算
    console.log(
      `Checking conditions: remainingMoves=${remainingMoves}, isProcessing=${isProcessing}, gameState=${gameState}`,
    ); // ★ デバッグログ追加
    if (
      remainingMoves < 3 ||
      isProcessing ||
      gameState !== "playing"
    ) {
      console.log("Cannot draw card now. Condition not met."); // ★ デバッグログ追加
      return;
    }

    // 手数を3消費
    const newMoves = moves + 3; // 手数は加算されるので注意
    console.log(
      `Drawing card: Consuming 3 moves. Old moves: ${moves}, New moves: ${newMoves}`,
    ); // ★ 既存ログ (前の適用で入っていた)
    setMoves(newMoves);

    // ランダムな倍率を生成 (0.01 ~ 1000)
    // 対数スケールでランダム性を出すと極端な値が出やすくなる
    // Math.random() は 0以上1未満の値を返す
    // ★ 最小値を 0.1 に変更
    const randomLog = Math.random() * (Math.log(1000) - Math.log(0.1)) +
      Math.log(0.1);
    const randomMultiplier = Math.exp(randomLog);
    const newMultiplier = parseFloat(randomMultiplier.toFixed(2)); // 小数点以下2桁に丸める

    // カード効果を設定
    setCardMultiplier(newMultiplier);
    setCardTurnsLeft(3); // 効果は3ターン
    setScoreMultiplier(newMultiplier);

    console.log(
      `Card drawn! Multiplier: ${newMultiplier}x for 3 turns. Moves left: ${
        currentMaxMoves - newMoves
      }`,
    ); // ★ 既存ログ

    // 手数消費によるゲームオーバーチェック
    checkGameOver(newMoves, score);
  };

  // 連鎖の各ステップ（マッチ消去、落下、補充）を処理するヘルパー関数
  const processChainStep = async (
    board: Array<Array<number | null>>,
    speed: number,
  ) => {
    // Prevent division by zero or negative waits by enforcing a minimum speed
    const safeSpeed = Math.max(speed, 0.1);
    const delay = 300 / safeSpeed; // 速度に基づいて遅延時間を計算

    let boardAfterStep = board.map((r) => [...r]);
    const matches = findMatches(boardAfterStep);

    // 1. マッチしたブロックを消す
    matches.forEach(({ row, col }) => {
      boardAfterStep[row][col] = null;
    });
    setBoard(boardAfterStep.map((r) => [...r])); // 消去状態を表示
    await new Promise((resolve) => setTimeout(resolve, delay)); // 少し待つ (アニメーションのため)

    // 2. ブロックを落下させる
    boardAfterStep = applyGravity(boardAfterStep);
    setBoard(boardAfterStep.map((r) => [...r])); // 落下状態を表示
    await new Promise((resolve) => setTimeout(resolve, delay)); // 少し待つ

    // 3. 新しいブロックを補充する
    boardAfterStep = refillBoard(boardAfterStep);
    setBoard(boardAfterStep.map((r) => [...r])); // 補充状態を表示
    await new Promise((resolve) => setTimeout(resolve, delay)); // 少し待つ

    return boardAfterStep;
  };

  // スコア計算とFloating Score表示を処理するヘルパー関数
  const updateScoreAndFloatingScores = (
    matches: { row: number; col: number }[],
    chainCount: number,
    currentChainScore: number,
  ) => {
    // スコア計算: 基本点 * 消した数^1.5 * 連鎖ボーナス
    // 基本点はステージに応じて増加
    const basePoints = 10 + (stage - 1) * 5; // Stage 1: 10, Stage 2: 15, ...
    // 連鎖ボーナス
    const chainBonus = Math.pow(2.5, chainCount - 1);
    // 消したブロック数ボーナス: 消した数^1.5
    const clearedBlocksBonus = Math.pow(matches.length, 1.5);

    const pointsEarned = Math.floor(
      basePoints * clearedBlocksBonus * chainBonus * cardMultiplier, // ★ カード倍率を適用
    ); // 整数にする

    // スコアの state を更新
    const newChainScore = currentChainScore + pointsEarned;
    setScore(newChainScore);

    // スコア倍率の state を更新 (表示用)
    // ★ 連鎖ボーナスとカード倍率を掛け合わせた値を設定
    setScoreMultiplier(chainBonus * cardMultiplier);

    // 加算スコア表示用の情報を生成
    const currentFloatingScores = matches.map(({ row, col }) => ({
      row,
      col,
      score: Math.floor(pointsEarned / matches.length), // 各ブロックごとのスコア（均等割り）
      id: scoreIdCounter.current++,
      chainCount: chainCount, // 現在の連鎖数を追加
    }));
    setFloatingScores((prev) => [...prev, ...currentFloatingScores]);

    // 一定時間後に表示を消す (1秒後)
    currentFloatingScores.forEach((fs) => {
      setTimeout(() => {
        setFloatingScores((prev) => prev.filter((pfs) => pfs.id !== fs.id));
      }, 1000);
    });

    return newChainScore;
  };

  // マッチ処理、落下、補充、連鎖処理を行う関数
  const processMatchesAndGravity = async (
    currentBoard: Array<Array<number | null>>,
    currentMoves: number,
  ) => {
    if (isProcessing) return;
    // ゲームオーバー or ステージクリア or 難易度選択中 or ステージクリアモーダル表示中なら処理しない
    if (gameState !== "playing") {
      setIsProcessing(false);
      return;
    }
    setIsProcessing(true);
    let boardAfterProcessing = currentBoard.map((r) => [...r]);
    let matches = findMatches(boardAfterProcessing);
    let chainCount = 0; // 連鎖カウントを初期化
    let currentChainScore = score; // ループ開始前のスコアを保持する変数

    while (matches.length > 0) {
      chainCount++; // 連鎖カウントを増やす

      // スコア計算とFloating Score表示を処理
      currentChainScore = updateScoreAndFloatingScores(
        matches,
        chainCount,
        currentChainScore,
      );

      // マッチ消去、落下、補充を処理
      boardAfterProcessing = await processChainStep(
        boardAfterProcessing,
        speed,
      ); // speed を渡す

      // 再度マッチをチェック (連鎖)
      matches = findMatches(boardAfterProcessing);

      // ループの最後にステージクリア状態をチェック (連鎖中にクリアした場合にループを抜ける)
      if (gameState !== "playing") {
        console.log("Stage cleared during chain, exiting process loop.");
        break; // 連鎖処理を中断
      }
    }

    // 連鎖が終わったら倍率をリセットする
    // ★ カード効果が残っている場合はカード倍率に、なければ1にリセット
    setScoreMultiplier(cardTurnsLeft > 0 ? cardMultiplier : 1);

    // 連鎖処理完了後に最終的なスコアでゲームステータスをチェック
    if (gameState === "playing") {
      // ステージクリアしていなければ判定
      checkStageClear(currentChainScore);
    }
    // 連鎖処理完了後に最終的なスコアと手数でゲームオーバーをチェック
    checkGameOver(currentMoves, currentChainScore);

    // 詰み状態チェック
    const hasPossibleMoves = checkForPossibleMoves(boardAfterProcessing);
    if (!hasPossibleMoves) {
      console.log("No possible moves, resetting board...");
      resetBoard(); // 詰みならリセット
    }

    setIsProcessing(false); // 処理完了
  };

  // useGameBoard フックの戻り値
  return {
    board,
    setBoard,
    moves,
    setMoves,
    selectedCell,
    setSelectedCell,
    isProcessing,
    score,
    scoreMultiplier,
    resetBoard,
    processMatchesAndGravity,
    floatingScores,
    stage,
    currentMaxMoves,
    currentTargetScore,
    handleProceedToNextStage, // 追加
    handleDifficultySelected, // 難易度選択ハンドラを追加
    nextStageGoals, // 次のステージの難易度ごとの目標を追加
    bonusMoves, // ★ ボーナス手数を追加
    drawCard, // ★ カードを引く関数を追加
    cardMultiplier, // ★ カード倍率を追加
    cardTurnsLeft, // ★ カード残りターン数を追加
    setCardMultiplier, // ★ カード倍率セッターを追加
    setCardTurnsLeft, // ★ カード残りターン数セッターを追加
    setScoreMultiplier,
    gameState, // ゲームの状態を追加
    // handleMoveAction, // ★ ターン経過処理を含む関数 (UI側で呼び出す想定)
  };
};

export default useGameBoard;
