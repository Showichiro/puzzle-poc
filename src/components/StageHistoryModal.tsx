import React from "react";
import StageHistoryChart from "./StageHistoryChart"; // 作成済みのチャートコンポーネントをインポート

interface StageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StageHistoryModal: React.FC<StageHistoryModalProps> = (
  { isOpen, onClose },
) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" // z-index を追加して手前に表示
      onClick={onClose} // 背景クリックで閉じる
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full" // サイズ調整
        onClick={(e) => e.stopPropagation()} // モーダル内部のクリックは伝播させない
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">過去の到達ステージ数</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl" // ボタンサイズ調整
            aria-label="Close modal"
          >
            &times; {/* 閉じるボタン */}
          </button>
        </div>
        <StageHistoryChart /> {/* チャートコンポーネントを表示 */}
      </div>
    </div>
  );
};

export default StageHistoryModal;
