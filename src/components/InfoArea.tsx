import { FC } from "react";
import { useHighestScore } from "../contexts/HighestScoreContext";

interface InfoAreaProps {
  stage: number;
  currentMaxMoves: number;
  moves: number;
  currentTargetScore: number;
  score: number;
  scoreMultiplier: number;
  // ★ カード関連の props を追加
  cardMultiplier: number;
  cardTurnsLeft: number;
  drawCard: () => void;
}

export const InfoArea: FC<InfoAreaProps> = (
  {
    stage,
    currentMaxMoves,
    currentTargetScore,
    moves,
    score,
    scoreMultiplier,
    // ★ カード関連の props を受け取る
    cardMultiplier,
    cardTurnsLeft,
    drawCard,
  },
) => {
  const { highestStage } = useHighestScore();
  const canDrawCard = currentMaxMoves - moves >= 3; // カードを引けるかどうかのフラグ

  return (
    // ★ grid-rows-3 に変更してカード情報を追加
    <div className="grid grid-cols-3 grid-rows-3 gap-x-4 gap-y-1 mb-4 p-2 bg-gray-100 rounded">
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
          Stage {highestStage}
        </span>
      </div>
      {/* Row 2 */}
      <div className="text-center col-span-2">
        {/* スコアは2列分使う */}
        <span className="text-xs text-gray-600 block">
          スコア / 目標
        </span>
        <span className="text-lg font-semibold">
          {score.toLocaleString()} / {currentTargetScore.toLocaleString()}
        </span>
      </div>
      <div className="text-center">
        <span className="text-xs text-gray-600 block">倍率</span>
        <span className="text-lg font-semibold">
          {/* ★ 小数点以下2桁まで表示 */}
          x{scoreMultiplier.toFixed(2)}
        </span>
      </div>
      {/* Row 3: Card Info and Draw Button */}
      <div className="text-center col-span-2">
        {cardTurnsLeft > 0 && ( // カード効果がある場合のみ表示
          <>
            <span className="text-xs text-gray-600 block">カード効果</span>
            <span className="text-lg font-semibold text-blue-600">
              スコア x{cardMultiplier.toFixed(2)} (あと{cardTurnsLeft}手)
            </span>
          </>
        )}
      </div>
      <div className="text-center">
        <button
          onClick={drawCard}
          disabled={!canDrawCard} // 手数が足りない場合は無効化
          className={`px-2 py-1 text-sm rounded ${
            canDrawCard
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          倍率変更
        </button>
      </div>
    </div>
  );
};
