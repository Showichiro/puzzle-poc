import { useEffect, useRef } from "react";
import StageHistoryChart from "./StageHistoryChart";

interface StageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StageHistoryModal: React.FC<StageHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto p-0 bg-transparent max-w-xl w-full backdrop:bg-black/50"
      onCancel={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full" // サイズ調整
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">過去の到達ステージ数</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl" // ボタンサイズ調整
            aria-label="Close modal"
          >
            &times; {/* 閉じるボタン */}
          </button>
        </div>
        <StageHistoryChart /> {/* チャートコンポーネントを表示 */}
      </div>
    </dialog>
  );
};

export default StageHistoryModal;
