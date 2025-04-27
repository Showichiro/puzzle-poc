import { useEffect, useRef, useState } from "react";
import {
  applyGravity,
  BOARD_SIZE,
  checkForPossibleMoves,
  findMatches,
  getRandomBlock,
  refillBoard,
  resetBlockTypes,
  selectStageColors,
} from "../utils/gameLogic";

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
  // ★ useState の初期化関数内で色選択と盤面生成を行う
  const [board, setBoard] = useState<Array<Array<number | null>>>(() => {
    selectStageColors(); // まず色を選択
    const initialBoard: Array<Array<number | null>> = Array(BOARD_SIZE)
      .fill(null)
      .map(
        () =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => getRandomBlock()), // 選択された色で盤面生成
      );

    // 初期盤面でマッチがないように調整
    let matches = findMatches(initialBoard);
    while (matches.length > 0) {
      matches.forEach(({ row, col }) => {
        initialBoard[row][col] = getRandomBlock();
      });
      matches = findMatches(initialBoard);
    }

    // 詰み状態チェック
    const hasPossibleMoves = checkForPossibleMoves(initialBoard);
    if (!hasPossibleMoves) {
      console.log("Initial board has no possible moves, regenerating...");
      // 詰みの場合は再帰的に初期化関数を呼び出す
      return Array(BOARD_SIZE)
        .fill(null)
        .map(() =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => getRandomBlock())
        );
    }

    return initialBoard;
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

  // ゲームステータス（ゲームオーバー or ステージクリア）をチェックする関数
  const checkGameStatus = (currentScore: number) => {
    // ★ showStageClearModal もチェック条件に追加
    if (
      isStageClear ||
      isGameOver ||
      showDifficultySelector ||
      showStageClearModal
    ) {
      return;
    }

    if (currentScore >= currentTargetScore) {
      // ステージクリア！
      setIsStageClear(true);
      console.log(`Stage ${stage} Clear! Score: ${currentScore}`);

      // ★ ボーナス手数を計算
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
          : calculatedBonusMoves, // 3手より大きなボーナスなし
      );
    }
  };

  // ★ ステージクリアモーダルから難易度選択へ進む関数
  const handleProceedToNextStage = () => {
    setShowStageClearModal(false); // ステージクリアモーダルを非表示
    setShowDifficultySelector(true); // 難易度選択モーダルを表示
  };

  // 難易度選択後に次のステージに進む関数
  const handleDifficultySelected = (selectedDifficulty: Difficulty) => {
    // 引数名を変更
    // ★ 念のためステージクリアモーダルも非表示にする
    setShowStageClearModal(false);
    setShowDifficultySelector(false); // 難易度選択モーダルを非表示
    setNextStageGoals(null); // 目標情報をリセット

    // ★ 次のステージの色を選択
    selectStageColors();

    const nextStage = stage + 1;

    console.log(
      `Advancing to Stage ${nextStage} with difficulty: ${selectedDifficulty}`,
    );
    setStage(nextStage);

    // ★ 次のステージの目標はステージクリア時に計算済みのため、nextStageGoals から取得
    if (!nextStageGoals) {
      // エラーハンドリング: nextStageGoals が null の場合はリセット
      console.error("nextStageGoals is null. Resetting board.");
      resetBoard();
      return;
    }

    // 選択された難易度に応じて目標を取得
    const nextGoal = nextStageGoals[selectedDifficulty];

    // ★ 残り手数に加算手数を足して、次のステージの最大手数を設定
    // ★ ボーナス手数も加算する
    const remainingMoves = currentMaxMoves - moves; // 現在の残り手数
    const newMaxMoves = remainingMoves + nextGoal.addedMoves + bonusMoves;
    setCurrentMaxMoves(newMaxMoves);

    // ★ 目標スコアを設定
    setCurrentTargetScore(nextGoal.targetScore);

    setMoves(0); // 次のステージは0手から開始
    // ★ スコアはリセットしない (引き継ぐ場合) か、リセットするかは要件次第。今回はリセットする。
    setScore(0);
    setIsStageClear(false); // ステージクリアフラグをリセット
    // ★ ボーナス手数もリセット
    setBonusMoves(0);

    // ★★★ 盤面全体を新しいステージの色で再生成 ★★★
    const newBoard = Array(BOARD_SIZE)
      .fill(null)
      .map(
        () =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => getRandomBlock()), // 新しい色で盤面を生成
      );

    // ★ 新しい盤面でマッチがないかチェックし、調整する (resetBoard と同様の処理)
    // adjustedBoard の型を明示的に指定
    let adjustedBoard: Array<Array<number | null>> = newBoard.map((r) => [
      ...r,
    ]);
    let matches = findMatches(adjustedBoard);
    while (matches.length > 0) {
      matches.forEach(({ row, col }) => {
        adjustedBoard[row][col] = getRandomBlock();
      });
      matches = findMatches(adjustedBoard);
    }
    // 重力と補充も適用しておく
    adjustedBoard = applyGravity(adjustedBoard);
    adjustedBoard = refillBoard(adjustedBoard);
    // 再度マッチがないか最終確認
    matches = findMatches(adjustedBoard);
    while (matches.length > 0) {
      matches.forEach(({ row, col }) => {
        adjustedBoard[row][col] = getRandomBlock();
      });
      matches = findMatches(adjustedBoard);
    }

    setBoard(adjustedBoard); // 調整後の新しい盤面を設定

    // 詰み状態チェック
    const hasPossibleMoves = checkForPossibleMoves(adjustedBoard);
    if (!hasPossibleMoves) {
      console.log("New stage board has no possible moves, resetting board...");
      resetBoard(); // 詰みならリセット
    }
  };

  // 盤面リセット関数 (ゲーム開始時、リトライ時)
  const resetBoard = () => {
    // ★ リセット時に新しい色を選択
    selectStageColors();
    resetBlockTypes(); // 空だが念のため呼ぶ

    // ★ 新しい色で初期盤面を生成
    let initialBoard: Array<Array<number | null>> = Array(BOARD_SIZE)
      .fill(null)
      .map(
        () =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => getRandomBlock()), // getRandomBlock を使用
      );

    // 初期盤面でマッチがないように調整 (新しい色で)
    let matches = findMatches(initialBoard);
    while (matches.length > 0) {
      matches.forEach(({ row, col }) => {
        initialBoard[row][col] = getRandomBlock(); // マッチした箇所を新しいブロックに置き換え
      });
      matches = findMatches(initialBoard); // 再度チェック
    }

    // 重力と補充も適用
    initialBoard = applyGravity(initialBoard);
    initialBoard = refillBoard(initialBoard);

    // 詰み状態チェック
    const hasPossibleMoves = checkForPossibleMoves(initialBoard);
    if (!hasPossibleMoves) {
      console.log("Reset board has no possible moves, resetting again...");
      // 詰みの場合は再帰的にリセット関数を呼び出す
      resetBoard();
      return; // 再帰呼び出しのためここで終了
    }

    setMoves(0);
    setBoard(initialBoard);

    // ステージと目標を初期化 (Stage 1)
    setStage(1);
    // ★ Stage 1 の初期手数と目標スコアを設定
    const initialResetTargetScore = calculateStageGoals(
      1,
      initialDifficulty,
    ).targetScore;
    setCurrentMaxMoves(initialMovesMap[initialDifficulty]);
    setCurrentTargetScore(initialResetTargetScore);

    setMoves(0);
    setScore(0);
    setIsGameOver(false);
    setIsStageClear(false); // クリアフラグもリセット
    // ★ ステージクリアモーダルもリセット
    setShowStageClearModal(false);
    setShowDifficultySelector(false); // 難易度選択フラグもリセット
    setNextStageGoals(null); // 目標情報もリセット
    // ★ ボーナス手数もリセット
    setBonusMoves(0);
    setScoreMultiplier(1);
    setFloatingScores([]);
    scoreIdCounter.current = 0;
  };

  // マッチ処理、落下、補充、連鎖処理を行う関数
  const processMatchesAndGravity = async (
    currentBoard: Array<Array<number | null>>,
    currentMoves: number,
  ) => {
    if (isProcessing) return;
    // ★ showStageClearModal もチェック条件に追加
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

      // スコア計算 (例: 基本点 * 消した数 * 連鎖ボーナス)
      // ステージに応じて基本点を増加させる
      const basePoints = 10 + (stage - 1) * 5; // ステージ1: 10, ステージ2: 15, ステージ3: 20...
      const chainBonus = Math.pow(3, chainCount - 1); // 1連鎖: 1倍, 2連鎖: 3倍, 3連鎖: 9倍...
      const blockTypeBonus = 1; // 固定値にするか、削除しても良い
      const currentMultiplier = chainBonus * blockTypeBonus; // 現在の連鎖での倍率
      setScoreMultiplier(currentMultiplier); // スコア倍率の状態を更新

      // 消したブロック数が多いほどスコアが大きく増えるように、matches.lengthに累乗を適用
      const clearedBlocksBonus = Math.pow(matches.length, 1.5);
      const pointsEarned = Math.floor(
        basePoints * clearedBlocksBonus * currentMultiplier,
      ); // 整数にする

      // ループ内で計算したスコアを一時変数に加算
      currentChainScore += pointsEarned;
      // スコアの state を更新
      setScore(currentChainScore);

      // 加算スコア表示用の情報を生成
      const currentFloatingScores = matches.map(({ row, col }) => ({
        row,
        col,
        score: Math.floor(pointsEarned / matches.length), // 各ブロックごとのスコア（均等割り）
        id: scoreIdCounter.current++,
        chainCount: chainCount, // 現在の連鎖数を追加
      }));
      setFloatingScores((prev) => [...prev, ...currentFloatingScores]);

      // 一定時間後に表示を消す
      currentFloatingScores.forEach((fs) => {
        setTimeout(() => {
          setFloatingScores((prev) => prev.filter((pfs) => pfs.id !== fs.id));
        }, 1000); // 1秒後に消える
      });

      // 1. マッチしたブロックを消す
      matches.forEach(({ row, col }) => {
        boardAfterProcessing[row][col] = null;
      });
      setBoard(boardAfterProcessing.map((r) => [...r])); // 消去状態を表示
      await new Promise((resolve) => setTimeout(resolve, 300)); // 少し待つ (アニメーションのため)

      // 2. ブロックを落下させる
      boardAfterProcessing = applyGravity(boardAfterProcessing);
      setBoard(boardAfterProcessing.map((r) => [...r])); // 落下状態を表示
      await new Promise((resolve) => setTimeout(resolve, 300)); // 少し待つ

      // 3. 新しいブロックを補充する
      boardAfterProcessing = refillBoard(boardAfterProcessing);
      setBoard(boardAfterProcessing.map((r) => [...r])); // 補充状態を表示
      await new Promise((resolve) => setTimeout(resolve, 300)); // 少し待つ

      // 4. 再度マッチをチェック (連鎖)
      matches = findMatches(boardAfterProcessing);

      // ループの最後にステージクリア状態をチェック (連鎖中にクリアした場合にループを抜ける)
      if (isStageClear) {
        console.log("Stage cleared during chain, exiting process loop.");
        break; // 連鎖処理を中断
      }
    }

    // 連鎖処理完了後に最終的なスコアでゲームステータスをチェック
    // ★ showStageClearModal もチェック条件に追加
    if (!isStageClear && !showDifficultySelector && !showStageClearModal) {
      // ステージクリアしていなければ判定
      // 1. ステージクリア判定
      checkGameStatus(currentChainScore);

      // 2. ステージクリアしておらず、かつ手数が上限に達していたらゲームオーバー判定
      if (!isStageClear && currentMoves >= currentMaxMoves) {
        console.log(
          `Game Over - Stage ${stage}. Moves: ${currentMoves}, Score: ${currentChainScore}, Target: ${currentTargetScore}`,
        );
        setIsGameOver(true); // ゲームオーバーフラグを立てる
      }
    }
    // 連鎖が終わったら倍率をリセットするのは継続
    setScoreMultiplier(1);

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
