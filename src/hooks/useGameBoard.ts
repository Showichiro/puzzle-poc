import { useEffect, useRef, useState } from "react";
import {
  applyGravity,
  BOARD_SIZE,
  checkForPossibleMoves,
  findMatches,
  getNumBlockTypes,
  getRandomBlock,
  refillBoard,
  resetBlockTypes,
} from "../utils/gameLogic";

const useGameBoard = () => {
  // 2次元配列で盤面状態を管理
  const [board, setBoard] = useState<Array<Array<number | null>>>(() =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() =>
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => Math.floor(Math.random() * getNumBlockTypes()))
      )
  );
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
  // ハイスコア
  const [highScore, setHighScore] = useState(0);
  // スコア倍率
  const [scoreMultiplier, setScoreMultiplier] = useState(1); // 初期値は1倍
  // 加算スコア表示用 state
  const [floatingScores, setFloatingScores] = useState<
    { row: number; col: number; score: number; id: number }[]
  >([]);
  const scoreIdCounter = useRef(0); // floating score にユニークIDを付与するためのカウンター

  useEffect(() => {
    const storedHighScore = localStorage.getItem("highScore");
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  // スコアが更新されたときにハイスコアを更新
  useEffect(() => {
    if (isGameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem("highScore", score.toString());
    }
  }, [isGameOver, score, highScore]);

  // 盤面をリセットする関数
  const resetBoard = () => {
    // ブロックの種類数をリセット
    resetBlockTypes();
    let initialBoard: Array<Array<number | null>> = Array(BOARD_SIZE)
      .fill(null)
      .map(() =>
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => Math.floor(Math.random() * getNumBlockTypes()))
      );

    // 初期盤面でマッチがないように調整
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
    setScore(0);
    setIsGameOver(false);
    setScoreMultiplier(1); // リセット時に倍率もリセット
  };

  // マッチ処理、落下、補充、連鎖処理を行う関数
  const processMatchesAndGravity = async (
    currentBoard: Array<Array<number | null>>,
  ) => {
    setIsProcessing(true);
    let boardAfterProcessing = currentBoard.map((r) => [...r]);
    let matches = findMatches(boardAfterProcessing);
    let chainCount = 0; // 連鎖カウントを初期化

    while (matches.length > 0) {
      chainCount++; // 連鎖カウントを増やす

      // スコア計算 (例: 基本点10点 * 消した数 * 連鎖ボーナス * ブロック種類数ボーナス)
      const basePoints = 10;
      const chainBonus = Math.pow(3, chainCount - 1); // 1連鎖: 1倍, 2連鎖: 3倍, 3連鎖: 9倍...
      const blockTypeBonus = Math.max(
        1,
        Math.floor(getNumBlockTypes() ** 2 / 9),
      ); // 最低1倍
      const currentMultiplier = chainBonus * blockTypeBonus; // 現在の連鎖での倍率
      setScoreMultiplier(currentMultiplier); // スコア倍率の状態を更新

      // 消したブロック数が多いほどスコアが大きく増えるように、matches.lengthに累乗を適用
      const clearedBlocksBonus = Math.pow(matches.length, 1.5);
      const pointsEarned = Math.floor(
        basePoints * clearedBlocksBonus * currentMultiplier,
      ); // 整数にする
      setScore((prevScore) => prevScore + pointsEarned);

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
    }
    // 処理完了後、詰み状態かチェック
    const hasMoves = checkForPossibleMoves(boardAfterProcessing);
    if (!hasMoves) {
      setIsGameOver(true);
    } else {
      // 連鎖が終わったら倍率をリセット
      setScoreMultiplier(1);
    }

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

    // 初期盤面の詰みチェック
    if (!checkForPossibleMoves(initialBoard)) {
      console.warn("Initial board has no possible moves!");
    }
  }, []);

  return {
    board,
    setBoard,
    moves,
    setMoves,
    selectedCell,
    setSelectedCell,
    isProcessing,
    setIsProcessing,
    isGameOver,
    setIsGameOver,
    score,
    setScore,
    highScore,
    setHighScore,
    scoreMultiplier, // 追加
    resetBoard,
    processMatchesAndGravity,
    floatingScores, // 追加
  };
};

export default useGameBoard;
