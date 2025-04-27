import React from "react";
import { AnimatePresence, motion } from "framer-motion"; // motion をインポート
import Cell from "./Cell";
import GameOverModal from "./GameOverModal";
import DifficultySelector from "./DifficultySelector"; // DifficultySelector をインポート
import useGameBoard from "../hooks/useGameBoard";
import { BOARD_SIZE, findMatches } from "../utils/gameLogic"; // increaseBlockTypes を削除

// Difficulty 型を App.tsx からインポートするか、ここで定義
type Difficulty = "easy" | "medium" | "hard";

interface GameBoardProps {
  initialDifficulty: Difficulty; // initialDifficulty プロパティに変更
}

// ★ StageClearModal の Props を拡張
interface StageClearModalProps {
  stage: number;
  score: number; // スコアを追加
  targetScore: number; // 目標スコアを追加
  onProceed: () => void;
  bonusMoves: number; // ★ ボーナス手数を追加
}
// ★ StageClearModal の実装を修正して追加情報を表示
const StageClearModal: React.FC<StageClearModalProps> = ({
  stage,
  score,
  targetScore,
  onProceed,
  bonusMoves, // ★ bonusMoves を受け取る
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    // ★ absolute を fixed に変更して画面全体に対して中央揃え
    className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-50"
  >
    <div className="bg-white p-8 rounded-lg shadow-xl text-center w-80">
      {/* 幅を少し指定 */}
      <h2 className="text-3xl font-bold mb-6 text-green-600">
        Stage {stage} Clear!
      </h2>
      {/* ★ 追加情報を表示 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-left">
        <span className="font-semibold text-gray-600">スコア:</span>
        <span>{score.toLocaleString()}</span>
        <span className="font-semibold text-gray-600">目標スコア:</span>
        <span>{targetScore.toLocaleString()}</span>
        {/* ★ ボーナス手数を表示 */}
        <span className="font-semibold text-gray-600">ボーナス手数:</span>
        <span>{bonusMoves}</span>
      </div>
      <p className="text-lg mb-8">おめでとうございます！</p>{" "}
      {/* 少しマージン調整 */}
      <button
        type="button"
        onClick={onProceed}
        className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
      >
        次のステージへ進む
      </button>
    </div>
  </motion.div>
);

const GameBoard: React.FC<GameBoardProps> = ({ initialDifficulty }) => { // Props を受け取る
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
    // ★ ステージクリアモーダル関連の state と関数を取得
    showStageClearModal,
    handleProceedToNextStage,
    showDifficultySelector, // 難易度選択フラグを追加
    handleDifficultySelected, // 難易度選択ハンドラを追加
    nextStageGoals, // 次のステージの難易度ごとの目標を追加
    // ★ 現在の難易度を取得
    bonusMoves, // ★ bonusMoves を取得
  } = useGameBoard(initialDifficulty); // initialDifficulty をフックに渡す

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
            score={score}
          />
        )}
        {/* ★ ステージクリアモーダルを表示し、追加情報を渡す */}
        {showStageClearModal && !isGameOver && (
          <StageClearModal
            stage={stage}
            score={score} // スコアを渡す
            targetScore={currentTargetScore} // 目標スコアを渡す
            onProceed={handleProceedToNextStage} // 次へ進む関数を渡す
            bonusMoves={bonusMoves} // ★ bonusMoves を渡す
          />
        )}
        {/* ★ 難易度選択モーダルを表示 */}
        {showDifficultySelector && !isGameOver && nextStageGoals && (
          <DifficultySelector
            onSelectDifficulty={handleDifficultySelected}
            // ★ nextStageGoals の型を修正
            nextStageGoals={nextStageGoals}
          />
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
      {/* ★ ステージクリアモーダル表示中もゲーム盤を非表示 */}
      {!showDifficultySelector && !showStageClearModal && (
        <div
          className={`grid gap-0 ${
            // ★ ステージクリアモーダル表示中も opacity を適用
            isGameOver || isStageClear || showStageClearModal
              ? "opacity-50"
              : ""}`}
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          }}
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
      )}
      {/* 加算スコア表示 */}
      {floatingScores.map(({ row, col, score, id, chainCount }) => { // chainCount を取得
        // スコアに基づいてフォントサイズを計算
        // スコアの対数を取り、最小値と最大値の間で線形補間
        const minScore = 100; // 調整可能な最小スコア
        const maxScore = 100000; // 調整可能な最大スコア
        const minFontSize = 1; // 最小フォントサイズ (rem)
        const maxFontSize = 3; // 最大フォントサイズ (rem)

        const clampedScore = Math.max(minScore, Math.min(maxScore, score));
        const logScore = Math.log(clampedScore);
        const logMinScore = Math.log(minScore);
        const logMaxScore = Math.log(maxScore);

        // 対数スケールでの線形補間
        const fontSize = minFontSize +
          (maxFontSize - minFontSize) *
            (logScore - logMinScore) /
            (logMaxScore - logMinScore);

        // スコアに基づいて明度 (Lightness) を計算
        // スコアの対数を取り、最小値と最大値の間で線形補間
        // スコアが低いほど明度が高く（白く）、高いほど明度が低く（濃く）なるようにする
        const minLightness = 40; // 最大スコア時の明度 (濃い色)
        const maxLightness = 90; // 最小スコア時の明度 (白に近い色)
        const lightness = minLightness +
          (maxLightness - minLightness) *
            (logMaxScore - logScore) / // スコアが増えるほど (logScoreが増えるほど) 明度が下がるように計算
            (logMaxScore - logMinScore);

        // 連鎖数に基づいて色相 (Hue) と彩度 (Saturation) を計算
        // 連鎖数が多いほど赤に近づける (色相: 50(黄) -> 0(赤), 彩度: 100%)
        const maxChainForColor = 10; // 色の変化の最大連鎖数 (10連鎖で赤)
        const clampedChain = Math.min(chainCount, maxChainForColor);
        // 連鎖1で黄(50)、連鎖10で赤(0) になるように補間
        const hue = 50 - (50 - 0) * (clampedChain - 1) / (maxChainForColor - 1);
        const saturation = 100; // 彩度は最大に固定

        // 連鎖数に基づいてアニメーションクラスを生成
        const shakeClass = chainCount > 1
          ? `chain-shake-${Math.min(chainCount, 10)}`
          : ""; // 連鎖数に応じてクラス名を変更 (最大6まで)

        return (
          <div
            key={id}
            className={`floating-score ${shakeClass}`} // クラス名を追加
            style={{
              position: "absolute", // 絶対配置にする
              top: `${row * (100 / BOARD_SIZE)}%`, // セルの高さに基づいて位置を計算
              left: `${col * (100 / BOARD_SIZE)}%`, // セルの幅に基づいて位置を計算
              width: `${100 / BOARD_SIZE}%`, // セルの幅に合わせる
              height: `${100 / BOARD_SIZE}%`, // セルの高さに合わせる
              display: "flex", // 中央寄せのために flexbox を使用
              justifyContent: "center", // 水平方向の中央寄せ
              alignItems: "center", // 垂直方向の中央寄せ
              fontSize: `${fontSize}rem`, // 計算したフォントサイズを適用
              fontWeight: "bold", // 太字にする
              color: `hsl(${hue}, ${saturation}%, ${lightness}%)`, // HSL形式で色を設定
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)", // 影をつける
              pointerEvents: "none", // クリックイベントを無効化
              zIndex: 10, // 他の要素より前面に表示
              // アニメーションは CSS で定義することを想定
            }}
          >
            +{score}
          </div>
        );
      })}
    </div> // Closing tag for the relative div
  );
};

export default GameBoard;
