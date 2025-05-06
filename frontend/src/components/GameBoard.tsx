import { AnimatePresence } from "framer-motion"; // motion をインポート
import Cell from "./Cell";
import GameOverModal from "./GameOverModal";
import DifficultySelector from "./DifficultySelector"; // DifficultySelector をインポート
import useGameBoard from "../hooks/useGameBoard";
import { BOARD_SIZE, findMatches } from "../utils/gameLogic"; // increaseBlockTypes を削除
import { InfoArea } from "./InfoArea";
import { FloatingScores } from "./FloatingScore";
import { StageClearModal } from "./StageClearModal";
import type { FC } from "react";

// Difficulty 型を App.tsx からインポートするか、ここで定義
type Difficulty = "easy" | "medium" | "hard";

interface GameBoardProps {
  initialDifficulty: Difficulty; // initialDifficulty プロパティに変更
}

const GameBoard: FC<GameBoardProps> = ({ initialDifficulty }) => {
  // Props を受け取る
  const {
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
    handleProceedToNextStage,
    handleDifficultySelected, // 難易度選択ハンドラを追加
    gameState,
    nextStageGoals, // 次のステージの難易度ごとの目標を追加
    // ★ 現在の難易度を取得
    bonusMoves, // ★ bonusMoves を取得
    // ★ カード関連の state と関数を取得
    drawCard,
    cardMultiplier,
    cardTurnsLeft,
    setCardMultiplier, // ターン経過で使用
    setCardTurnsLeft, // ターン経過で使用
    setScoreMultiplier,
  } = useGameBoard(initialDifficulty); // initialDifficulty をフックに渡す

  // セルクリック時のハンドラ
  const handleClick = (row: number, col: number) => {
    if (isProcessing || gameState === "gameOver") return; // 処理中またはゲームオーバー時は操作不可

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

        // ★ カード効果のターン経過処理
        setCardTurnsLeft((prev) => {
          if (prev <= 0) return prev; // nothing to do
          const next = prev - 1;
          if (next === 0) {
            setCardMultiplier(1); // 効果終了
            setScoreMultiplier(1);
            console.log("Card effect ended.");
          } else {
            console.log(`Card effect: ${cardMultiplier}x, Turns left: ${next}`);
          }
          return next;
        });

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
        {gameState === "gameOver" && (
          <GameOverModal resetBoard={resetBoard} stage={stage} score={score} />
        )}
        {/* ★ ステージクリアモーダルを表示し、追加情報を渡す */}
        {gameState === "stageClear" && (
          <StageClearModal
            stage={stage}
            score={score} // スコアを渡す
            targetScore={currentTargetScore} // 目標スコアを渡す
            onProceed={handleProceedToNextStage} // 次へ進む関数を渡す
            bonusMoves={bonusMoves} // ★ bonusMoves を渡す
          />
        )}
        {/* ★ 難易度選択モーダルを表示 */}
        {gameState === "difficultySelect" && nextStageGoals && (
          <DifficultySelector
            onSelectDifficulty={handleDifficultySelected}
            // ★ nextStageGoals の型を修正
            nextStageGoals={nextStageGoals}
          />
        )}
      </AnimatePresence>

      {/* --- 情報表示エリア --- */}
      <InfoArea
        currentMaxMoves={currentMaxMoves}
        currentTargetScore={currentTargetScore}
        score={score}
        scoreMultiplier={scoreMultiplier}
        stage={stage}
        moves={moves}
        // ★ カード関連の props を渡す
        cardMultiplier={cardMultiplier}
        cardTurnsLeft={cardTurnsLeft}
        drawCard={drawCard}
      />

      {/* --- ゲーム盤エリア --- */}
      {/* ★ ステージクリアモーダル表示中もゲーム盤を非表示 */}
      {gameState === "playing" && (
        <div
          className={`grid gap-0 ${
            // ★ ステージクリアモーダル表示中も opacity を適用
            gameState !== "playing" ? "opacity-50" : ""
          }`}
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {board.map((rowArr, rowIndex) =>
            rowArr.map((cellValue, colIndex) => (
              <Cell
                key={`${rowIndex}-${
                  // biome-ignore lint/suspicious/noArrayIndexKey:
                  colIndex
                }`}
                value={cellValue}
                onClick={() => handleClick(rowIndex, colIndex)}
                isSelected={
                  selectedCell?.row === rowIndex &&
                  selectedCell?.col === colIndex
                }
              />
            )),
          )}
        </div>
      )}
      {/* 加算スコア表示 */}
      {floatingScores.map(({ row, col, score, id, chainCount }) => {
        // chainCount を取得
        return (
          <FloatingScores
            key={id}
            row={row}
            col={col}
            score={score}
            chainCount={chainCount}
          />
        );
      })}
    </div> // Closing tag for the relative div
  );
};

export default GameBoard;
