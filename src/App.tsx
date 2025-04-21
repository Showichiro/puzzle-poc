import React, { useState } from "react";
import GameBoard from "./components/GameBoard";
import DifficultySelector from "./components/DifficultySelector"; // インポートを追加

type Difficulty = "easy" | "medium" | "hard";

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null); // 難易度の状態
  const [showDifficultySelector, setShowDifficultySelector] = useState(true); // ポップアップ表示の状態

  const handleSelectDifficulty = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setShowDifficultySelector(false); // ポップアップを非表示
  };

  return (
    <main className="container mx-auto max-w-lg p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">パズルゲーム</h1>
      {showDifficultySelector
        ? <DifficultySelector onSelectDifficulty={handleSelectDifficulty} />
        : (
          difficulty && <GameBoard difficulty={difficulty} /> // GameBoardに難易度を渡す
        )}
    </main>
  );
}

export default App;
