import { type FC, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import html2canvasPro from "html2canvas-pro";
import { version } from "../constants";
import { useAuth } from "../contexts/AuthContext";

interface GameOverModalProps {
  resetBoard: () => void;
  stage: number;
  score: number;
  difficulty: "easy" | "medium" | "hard";
}

// スコア投稿の状態を管理する型
type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; ranking?: number }
  | { status: "error"; message: string; retryCount: number };

const GameOverModal: FC<GameOverModalProps> = ({
  resetBoard,
  stage,
  score,
  difficulty,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { submitScore, user, isAuthenticated, refreshUser } = useAuth();
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });
  const hasAttemptedSubmit = useRef(false);

  // スコア投稿処理（依存関係を最小限に）
  const performScoreSubmit = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    setSubmitState({ status: "submitting" });

    try {
      const scoreData = {
        score,
        stage,
        difficulty,
        version,
      };

      const result = await submitScore(scoreData);

      if (result.success) {
        setSubmitState({
          status: "success",
          ranking: result.ranking,
        });
      } else {
        throw new Error("スコア投稿に失敗しました");
      }
    } catch (error) {
      console.error("Score submission error:", error);

      let message = "予期しないエラーが発生しました。";
      if (error instanceof Error) {
        if (error.message.includes("認証") || error.message.includes("auth")) {
          message = "認証が切れています。再認証が必要です。";
        } else if (
          error.message.includes("ネットワーク") ||
          error.message.includes("network")
        ) {
          message = "ネットワークエラーが発生しました。";
        } else {
          message = "スコア投稿に失敗しました。";
        }
      }

      const currentRetryCount =
        submitState.status === "error" ? submitState.retryCount : 0;
      setSubmitState({
        status: "error",
        message,
        retryCount: currentRetryCount,
      });
    }
  }, [difficulty, isAuthenticated, score, stage, submitScore, user]);

  // 初回スコア投稿（依存関係なし）
  useEffect(() => {
    if (isAuthenticated && user && !hasAttemptedSubmit.current) {
      hasAttemptedSubmit.current = true;
      performScoreSubmit();
    }
  }, [isAuthenticated, user, performScoreSubmit]);

  // リトライ処理
  const handleRetry = () => {
    if (submitState.status === "error" && submitState.retryCount < 3) {
      setSubmitState({
        ...submitState,
        retryCount: submitState.retryCount + 1,
      });
      performScoreSubmit();
    }
  };

  // 再認証処理
  const handleReauth = async () => {
    try {
      await refreshUser();
      // 再認証成功後、自動的にuseEffectが再実行される
    } catch (error) {
      setSubmitState({
        status: "error",
        message: "再認証に失敗しました。ページをリロードしてください。",
        retryCount: 0,
      });
    }
  };
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
          {stage} ステージまでクリアしました！
        </p>

        {/* 認証済みユーザーの表示 */}
        {isAuthenticated && user && (
          <div className="mb-4">
            <p className="text-gray-700">ユーザー: {user.name}</p>

            {/* 状態別表示 */}
            {submitState.status === "submitting" && (
              <div className="text-blue-600 mt-2">
                <p>スコアを投稿中...</p>
              </div>
            )}

            {submitState.status === "success" && (
              <div className="text-green-600 mt-2">
                {submitState.ranking ? (
                  <p className="font-bold">
                    ランキング: {submitState.ranking}位
                  </p>
                ) : (
                  <p>スコアを登録しました！</p>
                )}
              </div>
            )}

            {submitState.status === "error" && (
              <div className="text-red-600 mt-2">
                <p className="mb-2">{submitState.message}</p>
                {submitState.message.includes("認証") ? (
                  <button
                    type="button"
                    onClick={handleReauth}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm mr-2"
                  >
                    再認証
                  </button>
                ) : (
                  submitState.retryCount < 3 && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm mr-2"
                    >
                      リトライ ({submitState.retryCount + 1}/3)
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ゲストユーザーの表示 */}
        {!isAuthenticated && (
          <div className="mb-4 text-gray-600 bg-gray-100 p-3 rounded">
            <p className="text-sm">
              ゲストプレイ中のため、スコアは保存されません。
            </p>
            <p className="text-sm mt-1">スコアを記録するには認証が必要です。</p>
          </div>
        )}
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
