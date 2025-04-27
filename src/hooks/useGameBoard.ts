import { useEffect, useRef, useState } from "react";
import {
  applyGravity,
  BOARD_SIZE,
  checkForPossibleMoves,
  findMatches,
  getRandomBlock,
  refillBoard,
  selectStageColors,
} from "../utils/gameLogic";
import { useAnimationSpeed } from "../contexts/AnimationSpeedContext"; // AnimationSpeedContext をインポート

// Difficulty 型を定義
type Difficulty = "easy" | "medium" | "hard";

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
    easy: 1, // 簡単なら多く加算
    medium: 3,
    hard: 5, // 難しいなら少なく加算
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

  // 盤面を生成し、マッチがないように調整し、詰みチェックを行うヘルパー関数
  const createAndInitializeBoard = (): Array<Array<number | null>> => {
    let board: Array<Array<number | null>> = Array(BOARD_SIZE)
      .fill(null)
      .map(
        () =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => getRandomBlock()), // 選択された色で盤面生成
      );

    // 初期盤面でマッチがないように調整
    let matches = findMatches(board);
    while (matches.length > 0) {
      matches.forEach(({ row, col }) => {
        board[row][col] = getRandomBlock();
      });
      matches = findMatches(board);
    }

    // 重力と補充も適用
    board = applyGravity(board);
    board = refillBoard(board);

    // 詰み状態チェック
    const hasPossibleMoves = checkForPossibleMoves(board);
    if (!hasPossibleMoves) {
      console.log("Generated board has no possible moves, regenerating...");
      // 詰みの場合は再帰的に呼び出す
      return createAndInitializeBoard();
    }

    return board;
  };

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
  // ゲームオーバーフラグ
  const [isGameOver, setIsGameOver] = useState(false);
  // スコア
  const [score, setScore] = useState(0);
  // 最高クリアステージ
  const [highestStageCleared, setHighestStageCleared] = useState(0);
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
  // ステージクリアフラグ
  const [isStageClear, setIsStageClear] = useState(false);
  // ★ ステージクリアモーダル表示フラグを追加
  const [showStageClearModal, setShowStageClearModal] = useState(false);
  // 難易度選択モーダル表示フラグ
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
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

  useEffect(() => {
    // 最高クリアステージを読み込む
    const storedHighestStage = localStorage.getItem("highestStageCleared");
    if (storedHighestStage) {
      setHighestStageCleared(parseInt(storedHighestStage, 10));
    }
  }, []);

  // ゲームオーバー時に最高クリアステージを更新
  useEffect(() => {
    if (isGameOver) {
      const lastClearedStage = stage - 1; // 現在のステージの1つ前が最後にクリアしたステージ
      if (lastClearedStage > highestStageCleared) {
        setHighestStageCleared(lastClearedStage);
        localStorage.setItem(
          "highestStageCleared",
          lastClearedStage.toString(),
        );
        console.log(`New highest stage cleared: ${lastClearedStage}`);
      }
    }
  }, [isGameOver, stage, highestStageCleared]);

  // ステージクリア時にステージクリアモーダルを表示し、次のステージの目標を計算
  useEffect(() => {
    if (isStageClear) {
      // ★ 難易度選択ではなく、ステージクリアモーダルを表示
      setShowStageClearModal(true);
      // 次のステージの目標計算はここで行う
      const nextStage = stage + 1;
      // ★ 次のステージの目標計算 (calculateStageGoals は difficulty が必須になった)
      setNextStageGoals({
        easy: calculateStageGoals(nextStage, "easy"),
        medium: calculateStageGoals(nextStage, "medium"),
        hard: calculateStageGoals(nextStage, "hard"),
      });
    } else {
      // ★ ステージクリアモーダルも非表示にする
      setShowStageClearModal(false);
      setNextStageGoals(null); // 目標情報もリセット
    }
  }, [isStageClear, stage]);

  // ステージクリアをチェックする関数
  const checkStageClear = (currentScore: number) => {
    // ステージクリア済み、ゲームオーバー、難易度選択中、ステージクリアモーダル表示中はチェックしない
    if (
      isStageClear || isGameOver || showDifficultySelector ||
      showStageClearModal
    ) {
      return;
    }

    if (currentScore >= currentTargetScore) {
      // ステージクリア！
      setIsStageClear(true);
      console.log(`Stage ${stage} Clear! Score: ${currentScore}`);

      // ボーナス手数を計算
      const scoreRatio = currentTargetScore > 0
        ? currentScore / currentTargetScore
        : 0;
      let calculatedBonusMoves = 0;
      if (scoreRatio > 1.0) {
        calculatedBonusMoves = Math.floor(((scoreRatio - 1.0) * 100) / 500);
      }
      setBonusMoves(
        calculatedBonusMoves > 0
          ? Math.min(calculatedBonusMoves, 3)
          : calculatedBonusMoves,
      ); // 3手より大きなボーナスなし
    }
  };

  // ゲームオーバーをチェックする関数
  const checkGameOver = (currentMoves: number, currentScore: number) => {
    // ステージクリア済み、ゲームオーバー、難易度選択中、ステージクリアモーダル表示中はチェックしない
    if (
      isStageClear || isGameOver || showDifficultySelector ||
      showStageClearModal
    ) {
      return;
    }

    // ステージクリアしておらず、かつ手数が上限に達していたらゲームオーバー判定
    if (!isStageClear && currentMoves >= currentMaxMoves) {
      console.log(
        `Game Over - Stage ${stage}. Moves: ${currentMoves}, Score: ${currentScore}, Target: ${currentTargetScore}`,
      );
      setIsGameOver(true); // ゲームオーバーフラグを立てる
    }
  };

  // ★ ステージクリアモーダルから難易度選択へ進む関数
  const handleProceedToNextStage = () => {
    setShowStageClearModal(false); // ステージクリアモーダルを非表示
    setShowDifficultySelector(true); // 難易度選択モーダルを表示
  };

  // 難易度選択後に次のステージに進む関数
  const handleDifficultySelected = (selectedDifficulty: Difficulty) => {
    // モーダル非表示と目標情報のリセット
    setShowStageClearModal(false);
    setShowDifficultySelector(false);
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
    setIsStageClear(false);
    setBonusMoves(0);

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
    const initialResetTargetScore =
      calculateStageGoals(1, initialDifficulty).targetScore;
    setCurrentMaxMoves(initialMovesMap[initialDifficulty]);
    setCurrentTargetScore(initialResetTargetScore);

    setMoves(0);
    setScore(0);
    setIsGameOver(false);
    setIsStageClear(false);
    setShowStageClearModal(false);
    setShowDifficultySelector(false);
    setNextStageGoals(null);
    setBonusMoves(0);
    setScoreMultiplier(1);
    setFloatingScores([]);
    scoreIdCounter.current = 0;
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
    let matches = findMatches(boardAfterStep);

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
    // 連鎖ボーナス: 3^(連鎖数-1)
    const chainBonus = Math.pow(3, chainCount - 1); // 1連鎖: 1倍, 2連鎖: 3倍, 3連鎖: 9倍...
    // 消したブロック数ボーナス: 消した数^1.5
    const clearedBlocksBonus = Math.pow(matches.length, 1.5);

    const pointsEarned = Math.floor(
      basePoints * clearedBlocksBonus * chainBonus, // blockTypeBonus は常に1なので省略
    ); // 整数にする

    // スコアの state を更新
    const newChainScore = currentChainScore + pointsEarned;
    setScore(newChainScore);

    // スコア倍率の state を更新 (表示用)
    setScoreMultiplier(chainBonus); // 表示用には連鎖ボーナスのみを使用

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
    if (
      isGameOver ||
      isStageClear ||
      showDifficultySelector ||
      showStageClearModal
    ) {
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
      if (isStageClear) {
        console.log("Stage cleared during chain, exiting process loop.");
        break; // 連鎖処理を中断
      }
    }

    // 連鎖処理完了後に最終的なスコアでゲームステータスをチェック
    if (!isStageClear && !showDifficultySelector && !showStageClearModal) {
      // ステージクリアしていなければ判定
      checkStageClear(currentChainScore);
    }
    // 連鎖が終わったら倍率をリセットするのは継続
    setScoreMultiplier(1);

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
    isGameOver,
    score,
    highestStageCleared, // 追加
    scoreMultiplier,
    resetBoard,
    processMatchesAndGravity,
    floatingScores,
    stage,
    currentMaxMoves,
    currentTargetScore,
    isStageClear,
    showStageClearModal, // 追加
    handleProceedToNextStage, // 追加
    showDifficultySelector, // 難易度選択フラグを追加
    handleDifficultySelected, // 難易度選択ハンドラを追加
    nextStageGoals, // 次のステージの難易度ごとの目標を追加
    bonusMoves, // ★ ボーナス手数を追加
  };
};

export default useGameBoard;
