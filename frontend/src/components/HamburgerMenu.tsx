import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useAnimationSpeed } from "../contexts/AnimationSpeedContext";

interface HamburgerMenuProps {
  onOpenProfile: () => void;
  onOpenHistoryModal: () => void;
  onOpenInfoModal: () => void;
  onOpenRanking: () => void;
}

export const HamburgerMenu: FC<HamburgerMenuProps> = ({
  onOpenProfile,
  onOpenHistoryModal,
  onOpenInfoModal,
  onOpenRanking,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, signOut, setShowLoginScreen } = useAuth();
  const { speed, setSpeed } = useAnimationSpeed();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    onOpenProfile();
  };

  const handleHistoryClick = () => {
    setIsOpen(false);
    onOpenHistoryModal();
  };

  const handleInfoClick = () => {
    setIsOpen(false);
    onOpenInfoModal();
  };

  const handleSpeedChange = () => {
    setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : speed === 3 ? 0.5 : 1);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    signOut();
  };

  const handleLogin = () => {
    setIsOpen(false);
    setShowLoginScreen(true);
  };

  const handleRankingClick = () => {
    setIsOpen(false);
    onOpenRanking();
  };

  return (
    <div className="relative">
      {/* ハンバーガーボタン */}
      <button
        type="button"
        onClick={toggleMenu}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="メニューを開く"
      >
        <motion.div
          animate={isOpen ? "open" : "closed"}
          className="w-6 h-6 flex flex-col justify-center items-center"
        >
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: 45, y: 6 },
            }}
            className="w-6 h-0.5 bg-gray-600 block transition-all origin-center"
          />
          <motion.span
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 },
            }}
            className="w-6 h-0.5 bg-gray-600 block mt-1.5 transition-all"
          />
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: -45, y: -6 },
            }}
            className="w-6 h-0.5 bg-gray-600 block mt-1.5 transition-all origin-center"
          />
        </motion.div>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="メニューを閉じる"
          />

          {/* メニュー */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
          >
            {/* プロフィール（認証済みユーザーのみ） */}
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="プロフィールアイコン"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  プロフィール
                </button>

                {/* ランキング */}
                <button
                  type="button"
                  onClick={handleRankingClick}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="ランキングアイコン"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  ランキング
                </button>

                {/* 区切り線 */}
                <hr className="my-2 border-gray-200" />
              </>
            )}

            {/* スピード設定 */}
            <button
              type="button"
              onClick={handleSpeedChange}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="スピードアイコン"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                スピード設定
              </div>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                x{speed === 0.5 ? "0.5" : speed}
              </span>
            </button>

            {/* ステージ履歴 */}
            <button
              type="button"
              onClick={handleHistoryClick}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="履歴アイコン"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3"
                />
              </svg>
              ステージ履歴
            </button>

            {/* ゲーム情報 */}
            <button
              type="button"
              onClick={handleInfoClick}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="情報アイコン"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
              ゲーム情報
            </button>

            {/* 認証関連ボタン */}
            <hr className="my-2 border-gray-200" />

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="サインアウトアイコン"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                サインアウト
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="ログインアイコン"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                ログイン
              </button>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};
