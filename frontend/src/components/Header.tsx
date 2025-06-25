import { type FC, useState } from "react";
import { version } from "../constants";
import { HamburgerMenu } from "./HamburgerMenu";

interface HeaderProps {
  onOpenHistoryModal: () => void;
  onOpenProfile: () => void;
  onOpenRanking: () => void;
}

const Header: FC<HeaderProps> = ({
  onOpenHistoryModal,
  onOpenProfile,
  onOpenRanking,
}) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const openInfoModal = () => {
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
  };

  return (
    <header className="w-full flex justify-between items-center mb-4 p-4 bg-gray-100 rounded">
      <h1 className="text-2xl font-bold">パズルゲーム v{version}</h1>
      <div className="flex items-center">
        <HamburgerMenu
          onOpenProfile={onOpenProfile}
          onOpenHistoryModal={onOpenHistoryModal}
          onOpenInfoModal={openInfoModal}
          onOpenRanking={onOpenRanking}
        />
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
                連鎖ボーナス: 2<sup>(連鎖数 - 1)</sup>
              </li>
            </ul>
            <p>特殊消し:</p>
            <p>一列に5つ消すと、同じ色のブロックが全て消えます。</p>
            <p>ボーナス手数:</p>
            <p>
              目標スコアを上回ると、超過スコアに応じてボーナス手数が加算されます。超過スコアが大きいほど、ボーナス手数の増加率は緩やかになります。
            </p>
            <p className="mt-4 font-semibold">倍率変更機能:</p>
            <ul className="list-disc list-inside ml-4">
              <li>「倍率変更」ボタンで3手数を消費して、倍率を変更できます。</li>
              <li>
                3ターンの間、スコア計算時の倍率をランダムに変化させます
                (1倍から1000倍)。
              </li>
              <li>
                現在の効果（倍率と残りターン数）は、ゲーム画面上部の情報エリアで確認できます。
              </li>
            </ul>
            <button
              type="button"
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
