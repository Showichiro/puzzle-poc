import type { Context } from "hono";
import type { ErrorCode, ErrorResponse } from "./api";

// カスタムエラークラス
export class ScoreError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
  ) {
    super(message);
    this.name = "ScoreError";
  }
}

// 統一エラーレスポンス関数
export const errorResponse = (
  c: Context,
  error: ScoreError | Error,
  status = 400,
): Response => {
  const errorCode = error instanceof ScoreError ? error.code : "UNKNOWN_ERROR";
  const errorMessage = error.message || "An unexpected error occurred";

  const response: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  };

  // ログ出力
  console.error(`Error [${errorCode}]:`, errorMessage);
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }

  return c.json(response, status);
};

// バリデーションエラー用のヘルパー
export const validationError = (c: Context, message: string): Response => {
  return errorResponse(c, new ScoreError(message, "VALIDATION_ERROR"), 400);
};

// 認証エラー用のヘルパー
export const authError = (
  c: Context,
  message = "Authentication required",
): Response => {
  return errorResponse(c, new ScoreError(message, "AUTH_REQUIRED"), 401);
};

// データベースエラー用のヘルパー
export const dbError = (
  c: Context,
  message = "Database operation failed",
): Response => {
  return errorResponse(c, new ScoreError(message, "DB_ERROR"), 500);
};

// レート制限エラー用のヘルパー
export const rateLimitError = (
  c: Context,
  message = "Rate limit exceeded",
): Response => {
  return errorResponse(c, new ScoreError(message, "RATE_LIMITED"), 429);
};
