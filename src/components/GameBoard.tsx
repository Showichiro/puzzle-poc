import React from "react";
import { AnimatePresence } from "framer-motion"; // AnimatePresence をインポート
import Cell from "./Cell";
import GameOverModal from "./GameOverModal";
import useGameBoard from "../hooks/useGameBoard";
import {
  BOARD_SIZE,
  findMatches,
  increaseBlockTypes,
} from "../utils/gameLogic";

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
    highScore,
    scoreMultiplier, // 追加
    resetBoard,
    processMatchesAndGravity,
    floatingScores, // 追加
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
        setMoves((prevMoves) => prevMoves + 1); // 手数を増やす

        // 入れ替えによってマッチが発生するかチェックし、連鎖処理を開始
        const initialMatches = findMatches(newBoard);
        if (initialMatches.length > 0) {
          increaseBlockTypes(moves + 1);
          processMatchesAndGravity(newBoard);
        } else {
          // マッチしなかった場合は、入れ替えを元に戻すか、そのままにするか
          // 今回はそのままにする（無効な移動も許容する）
          // もし無効な移動を元に戻したい場合は、ここで newBoard を元の board に戻す
          setTimeout(() => {
            // 元に戻す前に現在の盤面が変更されていないか確認
            // (非同期処理中にユーザーがさらに操作する可能性を考慮)
            // 簡単な実装として、ここでは無条件に戻す
            setBoard((prevBoard) => {
              // selectedCellがnullでないと仮定して元に戻すのは危険かもしれない
              // より堅牢にするには、入れ替え前の状態を保存しておく必要がある
              // ここでは簡略化のため、現在のboard state (入れ替え後) を使う
              const revertedBoard = prevBoard.map((r) => [...r]);
              const revertedTemp = revertedBoard[selectedRow][selectedCol];
              revertedBoard[selectedRow][selectedCol] = revertedBoard[row][col];
              revertedBoard[row][col] = revertedTemp;
              // 状態を比較して本当に戻す必要があるか確認する方が良い
              // if (JSON.stringify(prevBoard) === JSON.stringify(newBoard)) { // 簡易比較
              //   return board; // 元のboard stateに戻す (入れ替え前の状態)
              // }
              // return prevBoard; // 変更があればそのまま
              // --- 修正: マッチしない場合は元の状態に戻す ---
              const originalBoard = board.map((r) => [...r]); // handleClick開始時のboardを使う
              return originalBoard;
            });
          }, 300); // 例：少し待ってから戻す
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
          <GameOverModal highScore={highScore} resetBoard={resetBoard} />
        )}
      </AnimatePresence>
      <div className="flex justify-between mb-2 text-lg">
        <span>ターン: {moves}</span>
        <span>倍率: x{scoreMultiplier.toFixed(1)}</span>{" "}
        {/* 小数点第一位まで表示 */}
        <span>ハイスコア: {highScore}</span>
      </div>
      <div className="mb-4 text-xl font-bold text-center">スコア: {score}</div>
      {" "}
      {/* スコア表示 */}
      <div
        className={`grid gap-0 ${isGameOver ? "opacity-50" : ""}`}
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
