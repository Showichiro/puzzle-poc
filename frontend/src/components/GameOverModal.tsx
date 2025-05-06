import { type FC, useRef } from "react";
import { motion } from "framer-motion";
import html2canvasPro from "html2canvas-pro";
import { version } from "../constants";

interface GameOverModalProps {
  resetBoard: () => void;
  stage: number;
  score: number;
}

const GameOverModal: FC<GameOverModalProps> = (
  { resetBoard, stage, score }, // highScore を highestStageCleared に変更
) => {
  const modalRef = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-white p-8 rounded shadow-lg text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-4">ゲームオーバー！ v{version}</h2>
        <p>スコア: {score}</p>
        <p className="text-xl font-semibold mb-4">
          {stage} ステージまでクリアしました！ v{version}
        </p>
        {/* highScore を highestStageCleared に変更 */}
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={resetBoard}
        >
          盤面をリセット
        </button>
        {navigator.share && (
          <button
            type="button"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={async () => {
              if (!modalRef.current) return;

              try {
                const canvas = await html2canvasPro(modalRef.current);
                canvas.toBlob(async (blob) => {
                  if (!blob) return;

                  const file = new File([blob], "gameover.png", {
                    type: "image/png",
                  });

                  if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({
                      files: [file],
                      title: "パズルゲーム スコア",
                      text: `ゲームオーバー！ステージ: ${stage}, スコア: ${score}`,
                      url: globalThis.location.href,
                    });
                    console.log("シェアしました");
                  } else {
                    // Web Share API Files がサポートされていない場合のフォールバック
                    // ここではシンプルにテキストとURLのみをシェアします
                    await navigator.share({
                      title: "パズルゲーム スコア",
                      text: `ゲームオーバー！ステージ: ${stage}, スコア: ${score}`,
                      url: globalThis.location.href,
                    });
                    console.log(
                      "テキストとURLをシェアしました (ファイルシェアは未対応)",
                    );
                  }
                }, "image/png");
              } catch (error) {
                console.error("シェアに失敗しました", error);
              }
            }}
          >
            結果をシェア
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal;
