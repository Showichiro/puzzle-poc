import { FC } from "react";
import { useHighestScore } from "../contexts/HighestScoreContext";

interface InfoAreaProps {
  stage: number;
  currentMaxMoves: number;
  moves: number;
  currentTargetScore: number;
  score: number;
  scoreMultiplier: number;
}

export const InfoArea: FC<InfoAreaProps> = (
  {
    stage,
    currentMaxMoves,
    currentTargetScore,
    moves,
    score,
    scoreMultiplier,
  },
) => {
  const { highestStage } = useHighestScore();
  return (
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
          x{scoreMultiplier.toFixed(1)}
        </span>
      </div>
    </div>
  );
};
