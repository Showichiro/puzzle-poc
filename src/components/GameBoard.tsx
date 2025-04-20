import React from "react";
import { AnimatePresence, motion } from "framer-motion"; // motion をインポート
import Cell from "./Cell";
import GameOverModal from "./GameOverModal";
import useGameBoard from "../hooks/useGameBoard";
import { BOARD_SIZE, findMatches } from "../utils/gameLogic"; // increaseBlockTypes を削除

const GameBoard: React.FC = () => {
  const {
    board,
    setBoard,
    moves,
    setMoves,
    selectedCell,
    setSelectedCell,
    isProcessing,
    isGameOver,
    score,
    // highScore, // highestStageCleared に変更
    highestStageCleared, // 追加
    scoreMultiplier,
    resetBoard,
    processMatchesAndGravity,
    floatingScores,
    // checkGameStatus, // 内部ロジックになったので削除
    stage,
    currentMaxMoves,
    currentTargetScore,
    isStageClear,
  } = useGameBoard();

  // セルクリック時のハンドラ
  const handleClick = (row: number, col: number) => {
    if (isProcessing || isGameOver) return; // 処理中またはゲームオーバー時は操作不可

    if (selectedCell) {
      const { row: selectedRow, col: selectedCol } = selectedCell;
      const isAdjacent =
        Math.abs(selectedRow - row) + Math.abs(selectedCol - col) === 1;

      if (isAdjacent) {
        // 隣接セルとの入れ替え
        const newBoard = board.map((r) => [...r]);
        const temp = newBoard[selectedRow][selectedCol];
        newBoard[selectedRow][selectedCol] = newBoard[row][col];
        newBoard[row][col] = temp;

        // 入れ替え直後の盤面を表示
        setBoard(newBoard);
        setSelectedCell(null); // 選択解除

        // 手数を増やし、ゲームステータスチェックは processMatchesAndGravity 内で行われる
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        // checkGameStatus(nextMoves, score); // 削除

        // 入れ替えによってマッチが発生するかチェックし、連鎖処理を開始
        const initialMatches = findMatches(newBoard);
        if (initialMatches.length > 0) {
          // ★ processMatchesAndGravity に nextMoves を渡す
          processMatchesAndGravity(newBoard, nextMoves);
        } else {
          // マッチしなかった場合は、入れ替えを元に戻す
          // 手数も元に戻す必要がある
          setMoves(moves); // 手数を元に戻す
          // 盤面状態をスワップ前の状態に戻す
          setTimeout(() => {
            // handleClick開始時のboard state (スワップ前) を使う
            setBoard(board.map((r) => [...r]));
          }, 300); // 少し待ってから戻す
        }
      } else {
        // 隣接していないセルをクリックした場合
        if (selectedRow === row && selectedCol === col) {
          setSelectedCell(null); // 同じセルなら選択解除
        } else {
          setSelectedCell({ row, col }); // 違うセルなら再選択
        }
      }
    } else {
      // 最初のセルを選択
      setSelectedCell({ row, col });
    }
  };

  return (
    <div className="relative">
      {/* ポップアップ表示のために relative を追加 */}
      <AnimatePresence>
        {isGameOver && (
          <GameOverModal
            highestStageCleared={highestStageCleared}
            resetBoard={resetBoard}
            stage={stage}
          /> // highScore を highestStageCleared に変更
        )}
        {/* ステージクリア表示 (オプション) */}
        {isStageClear && (
          <motion.div
            className="absolute inset-0 bg-green-500 bg-opacity-80 flex items-center justify-center z-20 text-white text-4xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            Stage {stage} Clear!
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-between mb-2 text-sm sm:text-base">
        <span>Stage: {stage}</span> {/* ステージ表示 */}
        <span>残り: {currentMaxMoves - moves}</span>
        <span>目標: {currentTargetScore.toLocaleString()}</span>
        <span>倍率: x{scoreMultiplier.toFixed(1)}</span>
        <span>最高記録: Stage {highestStageCleared}</span>{" "}
        {/* highScore を highestStageCleared に変更 */}
      </div>
      <div className="mb-4 text-xl font-bold text-center">
        スコア: {score.toLocaleString()}
      </div>
      <div
        className={`grid gap-0 ${
          isGameOver || isStageClear ? "opacity-50" : ""
        }`} // ステージクリア中も操作不可にする
        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
      >
        {board.map((rowArr, rowIndex) =>
          rowArr.map((cellValue, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={cellValue}
              onClick={() => handleClick(rowIndex, colIndex)}
              isSelected={selectedCell?.row === rowIndex &&
                selectedCell?.col === colIndex}
            />
          ))
        )}
      </div>
      {/* 加算スコア表示 */}
      {floatingScores.map(({ row, col, score, id }) => (
        <div
          key={id}
          className="floating-score"
          style={{
            top: `${row * (100 / BOARD_SIZE)}%`, // セルの高さに基づいて位置を計算
            left: `${col * (100 / BOARD_SIZE)}%`, // セルの幅に基づいて位置を計算
            width: `${100 / BOARD_SIZE}%`, // セルの幅に合わせる
            height: `${100 / BOARD_SIZE}%`, // セルの高さに合わせる
          }}
        >
          +{score}
        </div>
      ))}
    </div> // Closing tag for the relative div
  );
};

export default GameBoard;
