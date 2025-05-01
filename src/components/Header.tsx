import React, { useState } from "react";
import { useAnimationSpeed } from "../contexts/AnimationSpeedContext";

interface HeaderProps {
  onOpenHistoryModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenHistoryModal }) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const { speed, setSpeed } = useAnimationSpeed();

  const handleSpeedChange = () => {
    setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : speed === 3 ? 0.5 : 1);
  };

  const openInfoModal = () => {
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
  };

  return (
    <header className="w-full flex justify-between items-center mb-4 p-4 bg-gray-100 rounded">
      <h1 className="text-2xl font-bold">パズルゲーム</h1>
      <div className="flex items-center space-x-2">
        {/* ボタンを横並びにする */}
        <button
          type="button"
          onClick={handleSpeedChange}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          x{speed === 0.5 ? "0.5" : speed}
        </button>
        <button
          type="button"
          onClick={onOpenHistoryModal}
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
        <button
          className="font-bold py-2 px-4 rounded"
          onClick={openInfoModal}
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
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
        </button>
      </div>

      {isInfoModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex justify-center items-center z-100">
          <div className="bg-white p-8 rounded">
            <h2 className="text-xl font-bold mb-4">ゲーム情報</h2>
            <p>スコア計算:</p>
            <p>
              基本点 * 消した数<sup>1.5</sup> * 連鎖ボーナス
            </p>
            <ul>
              <li>基本点: 10 + (ステージ - 1) * 5</li>
              <li>
                消した数<sup>1.5</sup>: 消したブロック数の1.5乗
              </li>
              <li>
                連鎖ボーナス: 2.5<sup>(連鎖数 - 1)</sup>
              </li>
            </ul>
            <p>特殊消し:</p>
            <p>
              一列に5つ消すと、同じ色のブロックが全て消えます。
            </p>
            <p>ボーナス手数:</p>
            <p>
              目標スコアを上回ると、超過スコアに応じてボーナス手数が加算されます。超過スコアが大きいほど、ボーナス手数の増加率は緩やかになります。
            </p>
            <p className="mt-4 font-semibold">倍率変更機能:</p>
            <ul className="list-disc list-inside ml-4">
              <li>
                「倍率変更」ボタンで3手数を消費して、特殊なカードを引けます。
              </li>
              <li>
                3ターンの間、スコア計算時の倍率をランダムに変化させます
                (0.1倍から1000倍)。
              </li>
              <li>
                現在のカード効果（倍率と残りターン数）は、ゲーム画面上部の情報エリアで確認できます。
              </li>
            </ul>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={closeInfoModal}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
