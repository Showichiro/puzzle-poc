import React from "react";
import { AnimatePresence, motion } from "framer-motion"; // motion をインポート
import Cell from "./Cell";
import GameOverModal from "./GameOverModal";
import useGameBoard from "../hooks/useGameBoard";
import { BOARD_SIZE, findMatches } from "../utils/gameLogic"; // increaseBlockTypes を削除

// Difficulty 型を App.tsx からインポートするか、ここで定義
type Difficulty = "easy" | "medium" | "hard";

interface GameBoardProps {
  difficulty: Difficulty; // difficulty プロパティを追加
}

const GameBoard: React.FC<GameBoardProps> = ({ difficulty }) => { // Props を受け取る
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
    highestStageCleared, // 追加
    scoreMultiplier,
    resetBoard,
    processMatchesAndGravity,
    floatingScores,
    stage,
    currentMaxMoves,
    currentTargetScore,
    isStageClear,
    advanceToNextStage, // ★ 追加: 次のステージへ進む関数
  } = useGameBoard(difficulty); // difficulty をフックに渡す

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
    <div className="relative w-full">
      {/* ポップアップ表示のために relative を追加 */}
      <AnimatePresence>
        {isGameOver && (
          <GameOverModal
            highestStageCleared={highestStageCleared}
            resetBoard={resetBoard}
            stage={stage}
          /> // highScore を highestStageCleared に変更
        )}
        {/* ★ ステージクリア時の表示を修正 */}
        {isStageClear && (
          <motion.div
            className="absolute inset-0 bg-blue-500 bg-opacity-95 flex flex-col items-center justify-center z-20 text-white p-6 rounded-lg shadow-xl" // スタイル調整
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }} // exit アニメーション追加
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-4xl font-bold mb-4">Stage {stage} Clear!</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6 text-lg bg-blue-600 p-4 rounded">
              {/* 情報表示エリア */}
              {/* ★ 難易度表示を追加 (日本語化) */}
              <div className="text-right font-semibold">難易度:</div>
              <div className="text-left">
                {difficulty === "easy" ? "かんたん" : difficulty === "medium" ? "ふつう" : "むずかしい"}
              </div>
              <div className="text-right font-semibold">スコア:</div>
              <div className="text-left">
                {score.toLocaleString()} / {currentTargetScore.toLocaleString()}
              </div>
              <div className="text-right font-semibold">残り手数:</div>
              <div className="text-left">{currentMaxMoves - moves}</div>
            </div>
            <button
              onClick={advanceToNextStage} // ★ ボタンクリックで次のステージへ
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow hover:bg-gray-200 transition duration-200 text-xl" // スタイル調整
            >
              Next Stage →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 情報表示エリア --- */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 mb-4 p-2 bg-gray-100 rounded">
        {/* Row 1 */}
        <div className="text-center">
          <span className="text-xs text-gray-600 block">Stage</span>
          <span className="text-lg font-semibold">{stage}</span>
        </div>
        <div className="text-center">
          <span className="text-xs text-gray-600 block">残り手数</span>
          <span className="text-lg font-semibold">
            {currentMaxMoves - moves}
          </span>
        </div>
        <div className="text-center">
          <span className="text-xs text-gray-600 block">最高記録</span>
          <span className="text-lg font-semibold">
            Stage {highestStageCleared}
          </span>
        </div>
        {/* Row 2 */}
        <div className="text-center col-span-2">
          {/* スコアは2列分使う */}
          <span className="text-xs text-gray-600 block">スコア / 目標</span>
          <span className="text-lg font-semibold">
            {score.toLocaleString()} / {currentTargetScore.toLocaleString()}
          </span>
        </div>
        <div className="text-center">
          <span className="text-xs text-gray-600 block">倍率</span>
          <span className="text-lg font-semibold">
            x{scoreMultiplier.toFixed(1)}
          </span>
        </div>
      </div>
      {/* --- ゲーム盤エリア --- */}
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
