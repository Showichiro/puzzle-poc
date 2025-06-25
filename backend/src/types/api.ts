// API レスポンス型定義

export interface ScoreCreateResponse {
  success: boolean;
  id: number;
  ranking?: number;
}

export interface RankingResponse {
  rankings: Array<{
    rank: number;
    username: string;
    score: number;
    stage: number;
    difficulty: string;
    created_at: string;
  }>;
  total: number;
  user_rank?: number;
}

export interface UserScoreResponse {
  scores: Array<{
    id: number;
    score: number;
    stage: number;
    difficulty: string;
    created_at: string;
    version: string;
    rank: number;
  }>;
  total: number;
  stats: {
    total_games: number;
    highest_score: number;
    highest_stage: number;
    average_score: number;
    recent_game_count: number;
    currentRank: number;
    totalUsers: number;
  };
}

// エラーレスポンス型定義
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// 成功レスポンスのベース型
export interface SuccessResponse {
  success: true;
}

// スコア作成リクエストの型
export interface ScoreCreateRequest {
  score: number;
  stage: number;
  difficulty: "easy" | "medium" | "hard";
  version: string;
}

// ランキング取得クエリパラメータの型
export interface RankingQuery {
  limit?: number;
  offset?: number;
  difficulty?: "easy" | "medium" | "hard";
  period?: "daily" | "weekly" | "monthly" | "all";
}

// ユーザースコア取得クエリパラメータの型
export interface UserScoreQuery {
  limit?: number;
  offset?: number;
}

// エラーコード定数
export const ERROR_CODES = {
  INVALID_SCORE: "INVALID_SCORE",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  DB_ERROR: "DB_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface UserMeResponse {
  success: boolean;
  user: {
    id: number;
    name: string;
    stats: {
      total_games: number;
      highest_score: number;
      highest_stage: number;
      average_score: number;
      recent_game_count: number;
    };
  };
}
