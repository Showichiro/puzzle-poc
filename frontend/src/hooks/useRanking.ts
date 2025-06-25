import { useState, useCallback, useRef } from "react";
import { fetchRanking, fetchUserScoreHistory } from "../utils/ranking-api";
import type {
  RankingEntry,
  UserRankingInfo,
  UserScoreEntry,
  RankingFilters,
  PaginationInfo,
} from "../types/ranking";

interface UseRankingReturn {
  // 状態
  rankings: RankingEntry[];
  userRanking: UserRankingInfo | null;
  userScoreHistory: UserScoreEntry[];
  loading: boolean;
  error: string | null;
  filters: RankingFilters;
  pagination: PaginationInfo;

  // アクション
  setFilters: React.Dispatch<React.SetStateAction<RankingFilters>>;
  setPagination: React.Dispatch<React.SetStateAction<PaginationInfo>>;
  fetchRankingData: () => Promise<void>;
  fetchUserScoreHistoryData: (userId: string) => Promise<void>;
  refreshRanking: () => Promise<void>;
}

export function useRanking(): UseRankingReturn {
  // 状態管理
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [userRanking, setUserRanking] = useState<UserRankingInfo | null>(null);
  const [userScoreHistory, setUserScoreHistory] = useState<UserScoreEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<RankingFilters>({
    difficulty: "all",
    period: "all",
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  // 重複リクエスト防止
  const abortControllerRef = useRef<AbortController | null>(null);

  // エラーハンドリング
  const handleError = useCallback((err: unknown) => {
    console.error("Ranking fetch error:", err);
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("予期しないエラーが発生しました");
    }
  }, []);

  // 全体ランキング取得
  const fetchRankingData = useCallback(async () => {
    // 進行中のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const params = {
        limit: pagination.itemsPerPage,
        offset: (pagination.currentPage - 1) * pagination.itemsPerPage,
        ...(filters.difficulty !== "all" && { difficulty: filters.difficulty }),
        ...(filters.period !== "all" && { period: filters.period }),
      };

      const response = await fetchRanking(params);

      setRankings(response.rankings);

      // ユーザーランキング情報があれば設定
      if (response.user_rank !== undefined) {
        setUserRanking({
          rank: response.user_rank,
          totalUsers: response.total,
        });
      }

      // ページネーション情報更新
      setPagination((prev) => ({
        ...prev,
        totalItems: response.total,
        totalPages: Math.ceil(response.total / prev.itemsPerPage),
      }));
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        handleError(err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage, handleError]);

  // ユーザースコア履歴取得
  const fetchUserScoreHistoryData = useCallback(
    async (userId: string) => {
      if (!userId) return;

      // 進行中のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const params = {
          limit: pagination.itemsPerPage,
          offset: (pagination.currentPage - 1) * pagination.itemsPerPage,
          ...(filters.difficulty !== "all" && {
            difficulty: filters.difficulty,
          }),
          ...(filters.period !== "all" && { period: filters.period }),
        };

        const response = await fetchUserScoreHistory(userId, params);

        setUserScoreHistory(response.scores);

        // ユーザー統計情報があれば設定
        if (response.stats) {
          setUserRanking({
            rank: response.stats.currentRank,
            totalUsers: response.stats.totalUsers,
            highestScore: response.stats.highestScore,
            totalGames: response.stats.totalGames,
            averageScore: response.stats.averageScore,
          });
        }

        // ページネーション情報更新
        setPagination((prev) => ({
          ...prev,
          totalItems: response.total,
          totalPages: Math.ceil(response.total / prev.itemsPerPage),
        }));
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          handleError(err);
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [filters, pagination.currentPage, pagination.itemsPerPage, handleError],
  );

  // データ再取得
  const refreshRanking = useCallback(async () => {
    // 現在のページを1にリセットして再取得
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    await fetchRankingData();
  }, [fetchRankingData]);

  return {
    // 状態
    rankings,
    userRanking,
    userScoreHistory,
    loading,
    error,
    filters,
    pagination,

    // アクション
    setFilters,
    setPagination,
    fetchRankingData,
    fetchUserScoreHistoryData,
    refreshRanking,
  };
}
