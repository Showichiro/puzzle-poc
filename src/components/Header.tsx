import React from "react";
import { useAnimationSpeed } from "../contexts/AnimationSpeedContext";

interface HeaderProps {
  onOpenHistoryModal: () => void; // モーダルを開く関数の型定義を追加
}

const Header: React.FC<HeaderProps> = ({ onOpenHistoryModal }) => { // props を受け取る
  const { speed, setSpeed } = useAnimationSpeed();

  const handleSpeedChange = () => {
    setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : speed === 3 ? 0.5 : 1);
  };

  return (
    <header className="w-full flex justify-between items-center mb-4 p-4 bg-gray-100 rounded">
      <h1 className="text-2xl font-bold">パズルゲーム</h1>
      <div className="flex items-center space-x-2">
        {/* ボタンを横並びにする */}
        <button
          onClick={handleSpeedChange}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          速度: x{speed === 0.5 ? "0.5" : speed}
        </button>
        <button
          onClick={onOpenHistoryModal} // インフォボタンのクリックハンドラ
          className="px-3 py-2 rounded"
          aria-label="Show stage history"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
