import type React from "react";

// Difficulty 型を定義 (useGameBoard.ts と共有する場合は utils などに移動)
type Difficulty = "easy" | "medium" | "hard";

interface DifficultySelectorProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  nextStageGoals: Record<
    Difficulty,
    { addedMoves: number; targetScore: number }
  >; // 次のステージの難易度ごとの目標を追加
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  onSelectDifficulty,
  nextStageGoals,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded shadow-lg text-center">
        <h2 className="text-2xl mb-4">次のステージを選択してください</h2>
        <div className="flex flex-col items-center space-y-4">
          <button
            type="button"
            onClick={() => onSelectDifficulty("easy")}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 w-64 text-lg" // 幅を固定
          >
            ステージA
            {nextStageGoals?.easy ? ( // 目標情報があれば表示
              <div className="text-sm mt-1">
                目標: {nextStageGoals.easy.targetScore.toLocaleString()} /
                得られる手数: {nextStageGoals.easy.addedMoves}
              </div>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onSelectDifficulty("medium")}
            className="px-6 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 w-64 text-lg" // 幅を固定
          >
            ステージB
            {nextStageGoals?.medium ? ( // 目標情報があれば表示
              <div className="text-sm mt-1">
                目標: {nextStageGoals.medium.targetScore.toLocaleString()} /
                得られる手数: {nextStageGoals.medium.addedMoves}
              </div>
            ) : null}
          </button>
          {/* むずかしい */}
          <button
            type="button"
            onClick={() => onSelectDifficulty("hard")}
            className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 w-64 text-lg" // 幅を固定
          >
            ステージC
            {nextStageGoals?.hard ? ( // 目標情報があれば表示
              <div className="text-sm mt-1">
                目標: {nextStageGoals.hard.targetScore.toLocaleString()} /
                得られる手数: {nextStageGoals.hard.addedMoves}
              </div>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DifficultySelector;
