import { hc } from "hono/client";
import type { AppType } from "../../../backend/src/index";
import type { UserScoreResponse } from "../../../backend/src/index";
import type {
  RankingResponse,
  UserScoreHistoryResponse,
} from "../types/ranking";
import { cache } from "./cache";

// バックエンドAPIクライアント
const client = hc<AppType>(
  import.meta.env.VITE_API_URL || "http://localhost:8787",
);

// API パラメータ型定義
export interface RankingParams {
  limit?: number;
  offset?: number;
  difficulty?: "easy" | "medium" | "hard";
  period?: "daily" | "weekly" | "monthly" | "all";
}

// エラーハンドリング
class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "APIError";
  }
}

// 全体ランキング取得
export const getRanking = cache(
  async (params: RankingParams = {}): Promise<RankingResponse> => {
    try {
      const searchParams = new URLSearchParams();

      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.offset) searchParams.set("offset", params.offset.toString());
      if (params.difficulty) searchParams.set("difficulty", params.difficulty);
      if (params.period) searchParams.set("period", params.period);

      const response = await client.scores.ranking.$get({
        query: Object.fromEntries(searchParams),
      });

      if (!response.ok) {
        throw new APIError("ランキングの取得に失敗しました", response.status);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      throw new APIError("ネットワークエラーが発生しました");
    }
  },
);

// ユーザースコア履歴取得
export const getUserScoreHistory = cache(
  async (
    userId: string,
    params: RankingParams = {},
  ): Promise<UserScoreHistoryResponse> => {
    try {
      const searchParams = new URLSearchParams();

      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.offset) searchParams.set("offset", params.offset.toString());
      if (params.difficulty) searchParams.set("difficulty", params.difficulty);
      if (params.period) searchParams.set("period", params.period);

      const response = await client.scores.user[":userId"].$get({
        param: { userId },
        query: Object.fromEntries(searchParams),
      });

      if (!response.ok) {
        throw new APIError("スコア履歴の取得に失敗しました", response.status);
      }

      const data = (await response.json()) as UserScoreResponse;

      return {
        scores: data.scores.map((score, index: number) => ({
          ...score,
          rank: (params.offset ?? 0) + index + 1,
        })),
        total: data.total,
        stats: data.stats,
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      throw new APIError("ネットワークエラーが発生しました");
    }
  },
);
