import { motion } from "framer-motion";

// ★ StageClearModal の Props を拡張
interface StageClearModalProps {
  stage: number;
  score: number; // スコアを追加
  targetScore: number; // 目標スコアを追加
  onProceed: () => void;
  bonusMoves: number; // ★ ボーナス手数を追加
}
// ★ StageClearModal の実装を修正して追加情報を表示
export const StageClearModal: React.FC<StageClearModalProps> = ({
  stage,
  score,
  targetScore,
  onProceed,
  bonusMoves, // ★ bonusMoves を受け取る
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    // ★ absolute を fixed に変更して画面全体に対して中央揃え
    className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-50"
  >
    <div className="bg-white p-8 rounded-lg shadow-xl text-center w-80">
      {/* 幅を少し指定 */}
      <h2 className="text-3xl font-bold mb-6 text-green-600">
        Stage {stage} Clear!
      </h2>
      {/* ★ 追加情報を表示 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-left">
        <span className="font-semibold text-gray-600">スコア:</span>
        <span>{score.toLocaleString()}</span>
        <span className="font-semibold text-gray-600">目標スコア:</span>
        <span>{targetScore.toLocaleString()}</span>
        {/* ★ ボーナス手数を表示 */}
        <span className="font-semibold text-gray-600">ボーナス手数:</span>
        <span>{bonusMoves}</span>
      </div>
      <p className="text-lg mb-8">おめでとうございます！</p>{" "}
      {/* 少しマージン調整 */}
      <button
        type="button"
        onClick={onProceed}
        className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
      >
        次のステージへ進む
      </button>
    </div>
  </motion.div>
);
