import type { FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const WelcomeModal: FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 2;
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  🧩
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  パズルゲームへようこそ！
                </h2>
              </div>

              <div className="min-h-[280px]">
                {currentPage === 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                        遊び方
                      </h3>

                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-4 gap-0 w-fit mx-auto relative">
                          {[
                            {
                              color: "bg-red-300",
                              pattern: "●",
                              id: 1,
                              row: 0,
                              col: 0,
                            },
                            {
                              color: "bg-blue-300",
                              pattern: "■",
                              id: 2,
                              row: 0,
                              col: 1,
                            },
                            {
                              color: "bg-yellow-300",
                              pattern: "▲",
                              id: 3,
                              row: 0,
                              col: 2,
                            },
                            {
                              color: "bg-red-300",
                              pattern: "●",
                              id: 4,
                              row: 0,
                              col: 3,
                            },
                            {
                              color: "bg-blue-300",
                              pattern: "■",
                              id: 5,
                              row: 1,
                              col: 0,
                            },
                            {
                              color: "bg-yellow-300",
                              pattern: "▲",
                              id: 6,
                              row: 1,
                              col: 1,
                            },
                            {
                              color: "bg-blue-300",
                              pattern: "■",
                              id: 7,
                              row: 1,
                              col: 2,
                            },
                            {
                              color: "bg-red-300",
                              pattern: "●",
                              id: 8,
                              row: 1,
                              col: 3,
                            },
                            {
                              color: "bg-green-300",
                              pattern: "◆",
                              id: 9,
                              row: 2,
                              col: 0,
                            },
                            {
                              color: "bg-blue-300",
                              pattern: "■",
                              id: 10,
                              row: 2,
                              col: 1,
                            },
                            {
                              color: "bg-blue-300",
                              pattern: "■",
                              id: 11,
                              row: 2,
                              col: 2,
                            },
                            {
                              color: "bg-red-300",
                              pattern: "●",
                              id: 12,
                              row: 2,
                              col: 3,
                            },
                            {
                              color: "bg-green-300",
                              pattern: "◆",
                              id: 13,
                              row: 3,
                              col: 0,
                            },
                            {
                              color: "bg-green-300",
                              pattern: "◆",
                              id: 14,
                              row: 3,
                              col: 1,
                            },
                            {
                              color: "bg-yellow-300",
                              pattern: "▲",
                              id: 15,
                              row: 3,
                              col: 2,
                            },
                            {
                              color: "bg-blue-300",
                              pattern: "■",
                              id: 16,
                              row: 3,
                              col: 3,
                            },
                          ].map((cell, index) => {
                            const isSwapTarget1 = index === 8; // (2,0) 緑◆
                            const isSwapTarget2 = index === 14; // (3,2) 黄▲
                            const isMatched = [12, 13, 14].includes(index); // 入れ替え後に横に揃う緑◆3つ

                            // 入れ替え後の色とパターン
                            let finalColor = cell.color;
                            let finalPattern = cell.pattern;
                            if (isSwapTarget1) {
                              finalColor = "bg-yellow-300";
                              finalPattern = "▲";
                            } else if (isSwapTarget2) {
                              finalColor = "bg-green-300";
                              finalPattern = "◆";
                            }

                            return (
                              <motion.div
                                key={cell.id}
                                className={
                                  "w-10 h-10 border-2 flex items-center justify-center cursor-pointer select-none transition-colors duration-300"
                                }
                                initial={{
                                  scale: 1,
                                  opacity: 1,
                                  y: 0,
                                  x: 0,
                                }}
                                animate={{
                                  // 1. 選択アニメーション (0.5s後)
                                  borderColor: [
                                    "rgb(156, 163, 175)", // 通常
                                    isSwapTarget1 || isSwapTarget2
                                      ? "rgb(239, 68, 68)"
                                      : "rgb(156, 163, 175)", // 選択
                                    "rgb(156, 163, 175)", // 入れ替え後
                                    isMatched
                                      ? "rgb(239, 68, 68)"
                                      : "rgb(156, 163, 175)", // マッチ検出
                                    "rgb(156, 163, 175)", // 最終
                                  ],

                                  // 2. 入れ替えアニメーション
                                  x: isSwapTarget1
                                    ? [0, 0, 80, 80, 80, 80, 80]
                                    : isSwapTarget2
                                      ? [0, 0, -80, -80, -80, -80, -80]
                                      : 0,
                                  y: isSwapTarget1
                                    ? [0, 0, 40, 40, 40, 40, 40]
                                    : isSwapTarget2
                                      ? [0, 0, -40, -40, -40, -40, -40]
                                      : 0,

                                  // 3. マッチ消去アニメーション
                                  scale: isMatched
                                    ? [1, 1, 1, 1, 1.05, 1, 0]
                                    : 1,
                                  opacity: isMatched
                                    ? [1, 1, 1, 1, 0.8, 0.3, 0]
                                    : 1,
                                }}
                                transition={{
                                  duration: 7,
                                  times: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 1],
                                  repeat: Number.POSITIVE_INFINITY,
                                  repeatDelay: 2,
                                  ease: "easeInOut",
                                }}
                                style={{
                                  backgroundColor: `rgb(${
                                    finalColor === "bg-red-300"
                                      ? "252, 165, 165"
                                      : finalColor === "bg-blue-300"
                                        ? "147, 197, 253"
                                        : finalColor === "bg-yellow-300"
                                          ? "253, 224, 107"
                                          : finalColor === "bg-green-300"
                                            ? "134, 239, 172"
                                            : "209, 213, 219"
                                  })`,
                                }}
                              >
                                <motion.span
                                  className="text-lg text-black opacity-70 font-bold"
                                  animate={{
                                    opacity: [1, 1, 0, 1, 1, 1, 1],
                                  }}
                                  transition={{
                                    duration: 7,
                                    times: [0, 0.2, 0.22, 0.28, 0.4, 0.7, 1],
                                    repeat: Number.POSITIVE_INFINITY,
                                    repeatDelay: 2,
                                  }}
                                >
                                  {finalPattern}
                                </motion.span>
                              </motion.div>
                            );
                          })}
                        </div>
                        <div className="text-center mt-3">
                          <motion.div
                            className="inline-flex items-center space-x-1 text-sm text-gray-600"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 1.5,
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                          >
                            <span>👆</span>
                            <span>タップして消そう！</span>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-3 text-base text-gray-600">
                      <li className="flex items-start">
                        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        同じ色を3つ以上一列に揃えて消そう
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        連鎖を作ってハイスコアを目指そう
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        難易度を選んで自分のペースで楽しもう
                      </li>
                    </ul>
                  </motion.div>
                )}

                {currentPage === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center mb-3">
                        <span className="text-blue-500 mr-2 text-xl">🏆</span>
                        <h4 className="font-semibold text-blue-800 text-lg">
                          スコアを記録しよう
                        </h4>
                      </div>
                      <p className="text-base text-blue-700 mb-3">
                        ログインすると、ハイスコアやゲーム統計を記録して、成長を追跡できます！
                      </p>
                      <p className="text-sm text-blue-600">
                        今すぐログインしなくても、ゲーム中いつでもヘッダーのメニュー（≡）からログインできます
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={onLogin}
                        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-base"
                      >
                        ログインしてプレイ
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-base"
                      >
                        ゲストでプレイ
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  ← 前へ
                </button>

                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={index}
                      type="button"
                      onClick={() => setCurrentPage(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentPage ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage === totalPages - 1}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === totalPages - 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  次へ →
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>閉じる</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
