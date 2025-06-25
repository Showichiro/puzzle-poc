import { useState, useEffect, useCallback, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useRanking } from "../hooks/useRanking";

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string): string => {
  // Handle the case where created_at is "CURRENT_TIMESTAMP" string
  if (dateString === "CURRENT_TIMESTAMP") {
    return "データ取得中...";
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "日付不明";
  }

  return date.toLocaleDateString("ja-JP");
};

const LoadingSpinner: FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>
);

const ErrorDisplay: FC<{ error: string; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center">
      <div className="flex-1">
        <h3 className="text-red-800 font-medium">エラーが発生しました</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm transition-colors"
      >
        再試行
      </button>
    </div>
  </div>
);

export const RankingModal: FC<RankingModalProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"global" | "personal">("global");

  const {
    rankings,
    userRanking,
    userScoreHistory,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPagination,
    fetchRankingData,
    fetchUserScoreHistoryData,
  } = useRanking();

  // 初回データ取得
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "global") {
        fetchRankingData();
      } else if (activeTab === "personal" && isAuthenticated && user) {
        fetchUserScoreHistoryData(user.id.toString());
      }
    }
  }, [
    isOpen,
    activeTab,
    isAuthenticated,
    user,
    fetchRankingData,
    fetchUserScoreHistoryData,
  ]);

  // フィルター変更時のデータ再取得
  useEffect(() => {
    if (isOpen && activeTab === "global") {
      fetchRankingData();
    }
  }, [isOpen, activeTab, fetchRankingData]);

  const handleTabChange = useCallback(
    (tab: "global" | "personal") => {
      setActiveTab(tab);
      // ページネーションをリセット
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setPagination],
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      // ページネーションをリセット
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setFilters, setPagination],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    },
    [setPagination],
  );

  const handleClose = useCallback(() => {
    onClose();
    // 状態をリセット（オプション）
    setActiveTab("global");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [onClose, setPagination]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* オーバーレイ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />

        {/* モーダルコンテンツ */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">ランキング</h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="モーダルを閉じる"
              >
                (閉じる)
              </button>
            </div>

            {/* コンテンツエリア */}
            <div className="p-6">
              {/* タブヘッダー */}
              <div className="flex mb-6">
                <button
                  type="button"
                  onClick={() => handleTabChange("global")}
                  className={`px-4 py-2 font-medium rounded-l-lg border ${
                    activeTab === "global"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  全体ランキング
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("personal")}
                  className={`px-4 py-2 font-medium rounded-r-lg border-t border-r border-b ${
                    activeTab === "personal"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                  disabled={!isAuthenticated}
                >
                  個人記録
                </button>
              </div>

              {/* フィルター */}
              <div className="flex gap-4 mb-6">
                <div>
                  <label
                    htmlFor="difficulty-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    難易度
                  </label>
                  <select
                    id="difficulty-filter"
                    value={filters.difficulty}
                    onChange={(e) =>
                      handleFilterChange({
                        difficulty: e.target.value as
                          | "all"
                          | "easy"
                          | "medium"
                          | "hard",
                      })
                    }
                    className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">すべて</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="period-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    期間
                  </label>
                  <select
                    id="period-filter"
                    value={filters.period}
                    onChange={(e) =>
                      handleFilterChange({
                        period: e.target.value as
                          | "all"
                          | "daily"
                          | "weekly"
                          | "monthly",
                      })
                    }
                    className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">すべて</option>
                    <option value="daily">今日</option>
                    <option value="weekly">今週</option>
                    <option value="monthly">今月</option>
                  </select>
                </div>
              </div>

              {/* エラー表示 */}
              {error && (
                <ErrorDisplay
                  error={error}
                  onRetry={
                    activeTab === "global"
                      ? fetchRankingData
                      : () =>
                          fetchUserScoreHistoryData(user?.id?.toString() || "")
                  }
                />
              )}

              {/* メインコンテンツ */}
              {!error &&
                (activeTab === "global" ? (
                  /* 全体ランキング表示 */
                  <div className="space-y-6">
                    {loading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="hidden md:block px-6 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
                              <div>順位</div>
                              <div>プレイヤー</div>
                              <div>スコア</div>
                              <div>ステージ</div>
                              <div>難易度</div>
                              <div>日時</div>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {rankings.map((ranking) => (
                              <div
                                key={`${ranking.username}-${ranking.created_at}`}
                                className={`px-6 py-4 ${ranking.isCurrentUser ? "bg-blue-50" : ""}`}
                              >
                                {/* Desktop layout */}
                                <div className="hidden md:grid grid-cols-6 gap-4 text-sm">
                                  <div className="flex items-center">
                                    {ranking.rank === 1 && (
                                      <span className="mr-1">🥇</span>
                                    )}
                                    {ranking.rank === 2 && (
                                      <span className="mr-1">🥈</span>
                                    )}
                                    {ranking.rank === 3 && (
                                      <span className="mr-1">🥉</span>
                                    )}
                                    {ranking.isCurrentUser && (
                                      <span className="mr-1">→</span>
                                    )}
                                    <span className="font-medium">
                                      {ranking.rank}
                                    </span>
                                  </div>
                                  <div
                                    className={
                                      ranking.isCurrentUser
                                        ? "font-bold text-blue-700"
                                        : ""
                                    }
                                  >
                                    {ranking.username}
                                  </div>
                                  <div className="font-mono">
                                    {ranking.score.toLocaleString()}
                                  </div>
                                  <div>Stage {ranking.stage}</div>
                                  <div>
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        ranking.difficulty === "hard"
                                          ? "bg-red-100 text-red-800"
                                          : ranking.difficulty === "medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {ranking.difficulty}
                                    </span>
                                  </div>
                                  <div className="text-gray-500">
                                    {formatDate(ranking.created_at)}
                                  </div>
                                </div>

                                {/* Mobile layout */}
                                <div className="md:hidden space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      {ranking.rank === 1 && (
                                        <span className="mr-1">🥇</span>
                                      )}
                                      {ranking.rank === 2 && (
                                        <span className="mr-1">🥈</span>
                                      )}
                                      {ranking.rank === 3 && (
                                        <span className="mr-1">🥉</span>
                                      )}
                                      {ranking.isCurrentUser && (
                                        <span className="mr-1">→</span>
                                      )}
                                      <span className="font-medium">
                                        {ranking.rank}位
                                      </span>
                                    </div>
                                    <div
                                      className={
                                        ranking.isCurrentUser
                                          ? "font-bold text-blue-700"
                                          : ""
                                      }
                                    >
                                      {ranking.username}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="font-mono font-bold text-lg">
                                      {ranking.score.toLocaleString()}
                                    </div>
                                    <div className="text-gray-600">
                                      Stage {ranking.stage}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        ranking.difficulty === "hard"
                                          ? "bg-red-100 text-red-800"
                                          : ranking.difficulty === "medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {ranking.difficulty}
                                    </span>
                                    <div className="text-gray-500 text-xs">
                                      {formatDate(ranking.created_at)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ページネーション */}
                        {pagination.totalPages > 1 && (
                          <div className="flex justify-center">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handlePageChange(pagination.currentPage - 1)
                                }
                                disabled={
                                  pagination.currentPage === 1 || loading
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                前へ
                              </button>
                              <span className="px-3 py-2 text-sm text-gray-700">
                                {pagination.currentPage} /{" "}
                                {pagination.totalPages}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePageChange(pagination.currentPage + 1)
                                }
                                disabled={
                                  pagination.currentPage ===
                                    pagination.totalPages || loading
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                次へ
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : /* 個人記録表示 */
                isAuthenticated ? (
                  <div className="space-y-6">
                    {loading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        {/* ユーザー統計 */}
                        {userRanking && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4">
                              あなたの記録
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-blue-600">
                                  全体ランキング
                                </div>
                                <div className="text-2xl font-bold text-blue-900">
                                  {userRanking.rank}位 /{" "}
                                  {userRanking.totalUsers.toLocaleString()}人
                                </div>
                              </div>
                              {userRanking.highestScore && (
                                <div>
                                  <div className="text-sm text-blue-600">
                                    最高スコア
                                  </div>
                                  <div className="text-2xl font-bold text-blue-900">
                                    {userRanking.highestScore.toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* スコア履歴 */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                            <h4 className="text-lg font-medium text-gray-900">
                              スコア履歴
                            </h4>
                          </div>
                          <div className="hidden md:block px-6 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-500">
                              <div>スコア</div>
                              <div>ステージ</div>
                              <div>難易度</div>
                              <div>ランキング</div>
                              <div>日時</div>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {userScoreHistory.map((score, index) => (
                              <div
                                key={`${score.score}-${score.created_at}-${index}`}
                                className="px-6 py-4"
                              >
                                {/* Desktop layout */}
                                <div className="hidden md:grid grid-cols-5 gap-4 text-sm">
                                  <div className="font-mono font-medium">
                                    {score.score.toLocaleString()}
                                  </div>
                                  <div>Stage {score.stage}</div>
                                  <div>
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        score.difficulty === "hard"
                                          ? "bg-red-100 text-red-800"
                                          : score.difficulty === "medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {score.difficulty}
                                    </span>
                                  </div>
                                  <div className="font-medium">
                                    {score.rank}位
                                  </div>
                                  <div className="text-gray-500">
                                    {formatDate(score.created_at)}
                                  </div>
                                </div>

                                {/* Mobile layout */}
                                <div className="md:hidden space-y-2 text-sm">
                                  <div className="flex justify-between items-center">
                                    <div className="font-mono font-bold text-lg">
                                      {score.score.toLocaleString()}
                                    </div>
                                    <div className="font-medium text-blue-600">
                                      {score.rank}位
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-gray-600">
                                      Stage {score.stage}
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        score.difficulty === "hard"
                                          ? "bg-red-100 text-red-800"
                                          : score.difficulty === "medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {score.difficulty}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {formatDate(score.created_at)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ページネーション */}
                        {pagination.totalPages > 1 && (
                          <div className="flex justify-center">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handlePageChange(pagination.currentPage - 1)
                                }
                                disabled={
                                  pagination.currentPage === 1 || loading
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                前へ
                              </button>
                              <span className="px-3 py-2 text-sm text-gray-700">
                                {pagination.currentPage} /{" "}
                                {pagination.totalPages}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePageChange(pagination.currentPage + 1)
                                }
                                disabled={
                                  pagination.currentPage ===
                                    pagination.totalPages || loading
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                次へ
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <p>ログインして個人記録を確認してください</p>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default RankingModal;
