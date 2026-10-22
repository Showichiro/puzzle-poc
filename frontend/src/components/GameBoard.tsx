import { AnimatePresence } from "framer-motion"; // motion をインポート
import Cell from "./Cell";
import GameOverModal from "./GameOverModal";
import DifficultySelector from "./DifficultySelector"; // DifficultySelector をインポート
import useGameBoard from "../hooks/useGameBoard";
import { BOARD_SIZE } from "../utils/gameLogic"; // increaseBlockTypes を削除
import { InfoArea } from "./InfoArea";
import { FloatingScores } from "./FloatingScore";
import { StageClearModal } from "./StageClearModal";
import type { FC } from "react";

import type { Difficulty } from "../utils/gameRules";

interface GameBoardProps {
  initialDifficulty: Difficulty; // initialDifficulty プロパティに変更
}

const GameBoard: FC<GameBoardProps> = ({ initialDifficulty }) => {
  // Props を受け取る
  const {
    board,
    selectCell,
    moves,
    selectedCell,
    isProcessing,
    score,
    scoreMultiplier,
    resetBoard,
    floatingScores,
    stage,
    currentMaxMoves,
    currentTargetScore,
    handleProceedToNextStage,
    handleDifficultySelected, // 難易度選択ハンドラを追加
    gameState,
    nextStageGoals, // 次のステージの難易度ごとの目標を追加
    bonusMoves, // ★ bonusMoves を取得
    // ★ カード関連の state と関数を取得
    drawCard,
    cardMultiplier,
    cardTurnsLeft,
    selectedColors,
  } = useGameBoard(initialDifficulty); // initialDifficulty をフックに渡す

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
        isInteractive={gameState === "playing" && !isProcessing}
      />

      {/* --- ゲーム盤エリア --- */}
      {/* ★ ステージクリアモーダル表示中もゲーム盤を非表示 */}
      {gameState === "playing" && (
        <div
          className={"grid gap-0"}
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {board.map((rowArr, rowIndex) =>
            rowArr.map((cellValue, colIndex) => (
              <Cell
                // biome-ignore lint/suspicious/noArrayIndexKey: Cells represent fixed board coordinates.
                key={`${rowIndex}-${colIndex}`}
                value={cellValue}
                onClick={() => {
                  void selectCell(rowIndex, colIndex);
                }}
                isSelected={
                  selectedCell?.row === rowIndex &&
                  selectedCell?.col === colIndex
                }
                selectedColors={selectedColors}
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
