import { useEffect, useRef, useState } from "react";
import {
  applyGravity,
  BOARD_SIZE,
  checkForPossibleMoves, // 詰みチェック自体は残すが、ゲームオーバーにはしない
  findMatches,
  // getNumBlockTypes, // 削除
  getRandomBlock,
  refillBoard,
  resetBlockTypes,
  selectStageColors, // 追加
} from "../utils/gameLogic";

// ステージ目標と初期手数を計算する関数
const calculateStageGoals = (
  stage: number,
  difficulty?: Difficulty, // difficulty をオプション引数に追加
): { maxMoves: number; targetScore: number } => {
  // 難易度に応じた初期手数
  const initialMovesMap: Record<Difficulty, number> = {
    easy: 50,
    medium: 30,
    hard: 20,
  };

  const baseMaxMoves = 30; // ステージ2以降の基準手数
  const baseTargetScore = 100000;
  const moveDecrementPerStage = 2; // ステージが進むごとの手数減少量
  const scoreMultiplierPerStage = 1.5;
  const minMoves = 10;

  let maxMoves: number;
  if (stage === 1 && difficulty) {
    maxMoves = initialMovesMap[difficulty]; // ステージ1は難易度で手数を決定
  } else {
    // ステージ2以降は計算で手数を決定
    maxMoves = Math.max(
      minMoves,
      baseMaxMoves - (stage - 1) * moveDecrementPerStage, // ステージ1を基準にするため stage - 1
    );
  }

  const targetScore = Math.floor(
    baseTargetScore * Math.pow(scoreMultiplierPerStage, stage - 1), // 目標スコアはステージに応じて増加
  );

  return { maxMoves, targetScore };
};

// Difficulty 型を定義 (GameBoard.tsx と共有する場合は utils などに移動)
type Difficulty = "easy" | "medium" | "hard";

const useGameBoard = (difficulty: Difficulty) => { // difficulty を引数に追加
  // ★ useState の初期化関数内で色選択と盤面生成を行う
  const [board, setBoard] = useState<Array<Array<number | null>>>(() => {
    selectStageColors(); // まず色を選択
    return Array(BOARD_SIZE)
      .fill(null)
      .map(
        () =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => getRandomBlock()), // 選択された色で盤面生成
      );
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
  const [highestStageCleared, setHighestStageCleared] = useState(0); // highScore から変更
  // ステージレベル
  const [stage, setStage] = useState(1); // 現在のステージレベル
  // 現在の目標 (初期値は stage 1 と difficulty で計算)
  const initialGoals = calculateStageGoals(1, difficulty); // difficulty を渡す
  const [currentMaxMoves, setCurrentMaxMoves] = useState(initialGoals.maxMoves); // 現在の目標手数
  const [currentTargetScore, setCurrentTargetScore] = useState(
    initialGoals.targetScore, // 目標スコアは difficulty に依存しない
  ); // 現在の目標スコア
  // ステージクリアフラグ
  const [isStageClear, setIsStageClear] = useState(false);
  // スコア倍率
  const [scoreMultiplier, setScoreMultiplier] = useState(1); // 初期値は1倍
  // 加算スコア表示用 state
  const [floatingScores, setFloatingScores] = useState<
    { row: number; col: number; score: number; id: number }[]
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
  }, [isGameOver, stage, highestStageCleared]); // stage と highestStageCleared も依存配列に追加

  // ゲームステータス（ゲームオーバー or ステージクリア）をチェックする関数
  const checkGameStatus = (currentScore: number) => {
    if (isStageClear || isGameOver) return; // すでにステージクリアorゲームオーバーなら何もしない

    if (currentScore >= currentTargetScore) {
      // ステージクリア！
      setIsStageClear(true);
      console.log(`Stage ${stage} Clear! Score: ${currentScore}`);
      // 自動で次のステージに進む
      setTimeout(() => advanceToNextStage(), 1500); // 少し待ってから次のステージへ
    }
    // ★ 手数によるゲームオーバー判定はここでは行わない
    // else if (currentMoves >= currentMaxMoves) { ... }
  };

  // 次のステージに進む関数
  const advanceToNextStage = () => {
    // ★ 次のステージの色を選択
    selectStageColors();

    const nextStage = stage + 1;
    // if (nextStage > stageGoals.length) { ... }

    console.log(`Advancing to Stage ${nextStage}`);
    setStage(nextStage);
    // 次のステージの目標を計算
    const nextGoal = calculateStageGoals(nextStage);
    setCurrentMaxMoves(nextGoal.maxMoves);
    setCurrentTargetScore(nextGoal.targetScore);
    setMoves(0);
    setScore(0);
    setIsStageClear(false);

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

    setMoves(0);
    setBoard(initialBoard);

    // ステージと目標を初期化 (Stage 1 と difficulty で計算)
    setStage(1);
    const initialResetGoals = calculateStageGoals(1, difficulty); // difficulty を渡す
    setCurrentMaxMoves(initialResetGoals.maxMoves); // 難易度に応じた初期手数
    setCurrentTargetScore(initialResetGoals.targetScore);

    setMoves(0);
    setScore(0);
    setIsGameOver(false);
    setIsStageClear(false); // クリアフラグもリセット
    setScoreMultiplier(1);
    setFloatingScores([]);
    scoreIdCounter.current = 0;
  };

  // マッチ処理、落下、補充、連鎖処理を行う関数
  // ★ 引数に currentMoves を追加
  const processMatchesAndGravity = async (
    currentBoard: Array<Array<number | null>>,
    currentMoves: number,
  ) => {
    // isProcessing のチェックは先に行う
    if (isProcessing) return;
    // ゲームオーバー or ステージクリアなら処理しない
    if (isGameOver || isStageClear) {
      setIsProcessing(false); // 念のためフラグを下ろす
      return;
    }
    setIsProcessing(true);
    let boardAfterProcessing = currentBoard.map((r) => [...r]);
    let matches = findMatches(boardAfterProcessing);
    let chainCount = 0; // 連鎖カウントを初期化
    let currentChainScore = score; // ★ ループ開始前のスコアを保持する変数

    while (matches.length > 0) {
      chainCount++; // 連鎖カウントを増やす

      // スコア計算 (例: 基本点10点 * 消した数 * 連鎖ボーナス)
      const basePoints = 10;
      const chainBonus = Math.pow(3, chainCount - 1); // 1連鎖: 1倍, 2連鎖: 3倍, 3連鎖: 9倍...
      // const blockTypeBonus = Math.max(1, Math.floor(getNumBlockTypes() ** 2 / 9)); // 色数固定なのでボーナスは一定になる
      const blockTypeBonus = 1; // 固定値にするか、削除しても良い
      const currentMultiplier = chainBonus * blockTypeBonus; // 現在の連鎖での倍率
      setScoreMultiplier(currentMultiplier); // スコア倍率の状態を更新

      // 消したブロック数が多いほどスコアが大きく増えるように、matches.lengthに累乗を適用
      const clearedBlocksBonus = Math.pow(matches.length, 1.5);
      const pointsEarned = Math.floor(
        basePoints * clearedBlocksBonus * currentMultiplier,
      ); // 整数にする

      // ★ ループ内で計算したスコアを一時変数に加算
      currentChainScore += pointsEarned;
      // スコアの state を更新
      setScore(currentChainScore);

      // 加算スコア表示用の情報を生成
      const currentFloatingScores = matches.map(({ row, col }) => ({
        row,
        col,
        score: Math.floor(pointsEarned / matches.length), // 各ブロックごとのスコア（均等割り）
        id: scoreIdCounter.current++,
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

      // ★ ループの最後にステージクリア状態をチェック (連鎖中にクリアした場合にループを抜ける)
      if (isStageClear) {
        console.log("Stage cleared during chain, exiting process loop.");
        break; // 連鎖処理を中断
      }
    }

    // ★★★ 連鎖処理完了後に最終的なスコアでゲームステータスをチェック ★★★
    if (!isStageClear) {
      // ステージクリアしていなければ判定
      // 1. ステージクリア判定
      checkGameStatus(currentChainScore);

      // 2. ★ ステージクリアしておらず、かつ手数が上限に達していたらゲームオーバー判定
      //    引数で渡された currentMoves を使用
      if (!isStageClear && currentMoves >= currentMaxMoves) {
        // スコア判定は checkGameStatus で行われているので不要
        // if (currentChainScore < currentTargetScore) {
        console.log(
          `Game Over - Stage ${stage}. Moves: ${currentMoves}, Score: ${currentChainScore}, Target: ${currentTargetScore}`,
        );
        setIsGameOver(true); // ゲームオーバーフラグを立てる
        // }
        // 目標スコア達成の場合は checkGameStatus で isStageClear が true になっているはず
      }
    }
    // 処理完了後、詰み状態かチェック (ゲームオーバーにはしない)
    // const hasMoves = checkForPossibleMoves(boardAfterProcessing);
    // if (!hasMoves) {
    //   // setIsGameOver(true); // ★ 詰みによるゲームオーバー判定を削除
    //   console.log("No possible moves left, but game continues until move limit.");
    // } else {
    //   setScoreMultiplier(1);
    // }
    // 連鎖が終わったら倍率をリセットするのは継続
    setScoreMultiplier(1);

    setIsProcessing(false); // 処理完了
  };

  // 初期盤面でマッチがないように調整し、詰み状態もチェックする
  useEffect(() => {
    let initialBoard = board.map((r) => [...r]);
    let matches = findMatches(initialBoard);
    while (matches.length > 0) {
      matches.forEach(({ row, col }) => {
        initialBoard[row][col] = getRandomBlock();
      });
      matches = findMatches(initialBoard);
    }
    // 重力と補充も初回に適用しておく
    initialBoard = applyGravity(initialBoard);
    initialBoard = refillBoard(initialBoard);
    // 再度マッチがないか最終確認
    matches = findMatches(initialBoard);
    while (matches.length > 0) {
      matches.forEach(({ row, col }) => {
        initialBoard[row][col] = getRandomBlock();
      });
      matches = findMatches(initialBoard);
    }
    setBoard(initialBoard);

    // 初期盤面の詰みチェックはログ出力程度に留める
    if (!checkForPossibleMoves(initialBoard)) {
      console.warn(
        "Initial board has no possible moves! Consider reshuffling.",
      );
      // 必要であればここで盤面再生成やシャッフル処理を呼ぶ
    }
  }, []);

  return {
    board,
    setBoard,
    moves,
    setMoves, // 手数設定は外部で必要になる可能性は低いが、残しておく
    selectedCell,
    setSelectedCell,
    isProcessing, // 処理中フラグは外部で参照する可能性あり
    // setIsProcessing, // 内部でのみ使用
    isGameOver, // ゲームオーバー状態は外部で参照
    // setIsGameOver, // 内部でのみ使用
    score,
    // setScore, // 内部でのみ使用
    highestStageCleared,
    // setHighestStageCleared, // 内部でのみ使用
    scoreMultiplier,
    resetBoard, // リセットは外部から必要
    processMatchesAndGravity,
    floatingScores,
    // checkGameOver, // 削除済み
    checkGameStatus, // ゲームステータスチェックは内部ロジックの一部なので export しない
    stage,
    currentMaxMoves,
    currentTargetScore,
    isStageClear, // ステージクリア状態は外部で参照する可能性あり
    // advanceToNextStage, // 内部でのみ使用
  };
};

export default useGameBoard;
