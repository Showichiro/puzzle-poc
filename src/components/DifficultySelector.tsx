import React from "react";

interface DifficultySelectorProps {
  onSelectDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = (
  { onSelectDifficulty },
) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded shadow-lg text-center">
        <h2 className="text-2xl mb-4">難易度を選択してください</h2>
        <div className="space-x-4">
          <button
            onClick={() => onSelectDifficulty("easy")}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            かんたん
          </button>
          <button
            onClick={() => onSelectDifficulty("medium")}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            ふつう
          </button>
          <button
            onClick={() => onSelectDifficulty("hard")}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            むずかしい
          </button>
        </div>
      </div>
    </div>
  );
};

export default DifficultySelector;
