# Phase 1 実装計画詳細

## 現在の分析結果

### データベース現状
- **スキーマファイル**: `backend/src/db/schema.ts`
- **現在のscoresテーブル**: 基本構造のみ実装済み
  ```typescript
  export const scores = sqliteTable("scores", {
    id: int().primaryKey({ autoIncrement: true }),
    user_id: int().notNull(),
    version: text().notNull(),
    order: int().notNull(),
  });
  ```
- **不足している列**: score, stage, difficulty, created_at

### マイグレーション状況
- **既存マイグレーション**: `drizzle/0000_breezy_the_watchers.sql` (users テーブルのみ)
- **scoresテーブル**: マイグレーション未実行
- **passkeyテーブル**: スキーマは定義済みだが、drizzleディレクトリとの不整合あり

## Phase 1 実装タスク詳細

### 1. データベーススキーマ修正とマイグレーション

#### 1.1 スキーマファイル更新
**ファイル**: `backend/src/db/schema.ts`

**修正内容**:
```typescript
export const scores = sqliteTable("scores", {
  id: int().primaryKey({ autoIncrement: true }),
  user_id: int().notNull(),
  version: text().notNull(),
  order: int().notNull(),
  score: int().notNull().default(0),
  stage: int().notNull().default(1),
  difficulty: text().notNull().default('medium'), // 'easy' | 'medium' | 'hard'
  created_at: text().notNull().default("CURRENT_TIMESTAMP"),
});
```

**理由**: 
- スコア値、ステージ、難易度、作成日時の追加
- デフォルト値の設定によりNULL制約を安全に追加

#### 1.2 マイグレーション実行
**コマンド**: 
- ローカル: `bun db:push:local`
- 本番: `bun db:push`

**注意点**:
- 既存データへの影響を考慮
- バックアップ推奨（本番環境）

### 2. Repository層実装

#### 2.1 ファイル作成
**ファイル**: `backend/src/repository/scores.ts`

**実装する関数**:
```typescript
import { and, desc, eq, sql } from "drizzle-orm";
import type { CloudflareBindings } from "../bindings";
import { scores, users } from "../db/schema";
import { getDrizzle } from "../db/connection";

// スコア登録
export async function createScore(
  env: CloudflareBindings,
  data: {
    userId: number;
    score: number;
    stage: number;
    difficulty: 'easy' | 'medium' | 'hard';
    version: string;
    order: number;
  }
): Promise<{ id: number; ranking?: number }>;

// ランキング取得
export async function getRanking(
  env: CloudflareBindings,
  options: {
    limit?: number;
    offset?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    period?: 'daily' | 'weekly' | 'monthly' | 'all';
  } = {}
): Promise<{
  rankings: Array<{
    rank: number;
    username: string;
    score: number;
    stage: number;
    difficulty: string;
    created_at: string;
  }>;
  total: number;
}>;

// ユーザー個人スコア履歴
export async function getUserScores(
  env: CloudflareBindings,
  userId: number,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<Array<{
  id: number;
  score: number;
  stage: number;
  difficulty: string;
  created_at: string;
  version: string;
}>>;

// ユーザーランキング順位取得
export async function getUserRanking(
  env: CloudflareBindings,
  userId: number,
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<number | null>;
```

#### 2.2 実装詳細

**期間フィルタリング**:
```typescript
// SQLite用の期間フィルタ
const getPeriodFilter = (period: string) => {
  switch (period) {
    case 'daily':
      return sql`date(created_at) = date('now')`;
    case 'weekly':
      return sql`date(created_at) >= date('now', '-7 days')`;
    case 'monthly':
      return sql`date(created_at) >= date('now', '-1 month')`;
    default:
      return undefined;
  }
};
```

**ランキング計算**:
```typescript
// 順位計算のためのWINDOW関数使用
const rankingQuery = db
  .select({
    id: scores.id,
    score: scores.score,
    stage: scores.stage,
    difficulty: scores.difficulty,
    created_at: scores.created_at,
    username: users.name,
    rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${scores.score} DESC, ${scores.created_at} ASC)`.as('rank')
  })
  .from(scores)
  .innerJoin(users, eq(scores.user_id, users.id));
```

### 3. API エンドポイント実装

#### 3.1 ファイル修正
**ファイル**: `backend/src/index.ts`

**追加するエンドポイント**:

**POST /scores**:
```typescript
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const scoreSchema = z.object({
  score: z.number().int().min(0),
  stage: z.number().int().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  version: z.string(),
});

app.post('/scores', 
  zValidator('json', scoreSchema),
  async (c) => {
    // 認証チェック
    // スコア登録処理
    // レスポンス返却
  }
);
```

**GET /scores/ranking**:
```typescript
const rankingQuerySchema = z.object({
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'all']).optional(),
});

app.get('/scores/ranking',
  zValidator('query', rankingQuerySchema),
  async (c) => {
    // ランキング取得処理
  }
);
```

**GET /scores/user/:userId**:
```typescript
app.get('/scores/user/:userId', async (c) => {
  const userId = Number(c.req.param('userId'));
  // ユーザー個人スコア取得処理
});
```

#### 3.2 認証ミドルウェア
**新規ファイル**: `backend/src/middleware/auth.ts`

```typescript
import type { Context, Next } from 'hono';
import type { CloudflareBindings } from '../bindings';

export async function requireAuth(c: Context<{ Bindings: CloudflareBindings }>, next: Next) {
  // セッション確認
  // ユーザー情報取得
  // c.set('user', user);
  await next();
}
```

### 4. 型定義整備

#### 4.1 API レスポンス型
**ファイル**: `backend/src/types/api.ts`

```typescript
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
  }>;
  total: number;
}
```

### 5. セキュリティ実装

#### 5.1 入力値検証
- Zodスキーマによる厳密な型チェック
- スコア値の上限設定（例: 1,000,000）
- ステージ数の妥当性チェック

#### 5.2 レート制限
```typescript
// 簡易レート制限実装
const RATE_LIMIT = {
  SCORE_SUBMIT: 60, // 1分間に1回
  RANKING_REQUEST: 100, // 1分間に100回
};
```

### 6. エラーハンドリング

#### 6.1 エラー型定義
```typescript
export class ScoreError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_SCORE' | 'AUTH_REQUIRED' | 'RATE_LIMITED' | 'DB_ERROR'
  ) {
    super(message);
  }
}
```

#### 6.2 統一エラーレスポンス
```typescript
export const errorResponse = (c: Context, error: ScoreError, status: number = 400) => {
  return c.json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  }, status);
};
```

## 実装順序

1. **データベーススキーマ更新** (30分)
   - schema.ts修正
   - マイグレーション実行

2. **Repository層実装** (90分)
   - scores.ts作成
   - 各関数実装
   - テスト用クエリ確認

3. **API エンドポイント実装** (90分)
   - POST /scores
   - GET /scores/ranking
   - GET /scores/user/:userId

4. **認証ミドルウェア実装** (30分)
   - auth.ts作成
   - セッション管理

5. **型定義・エラーハンドリング** (30分)
   - api.ts作成
   - エラー型定義

6. **テスト・動作確認** (60分)
   - 各エンドポイントテスト
   - エラーケース確認

## 予想される課題と対策

### 1. 認証状態管理
**課題**: 現在の認証実装とAPI認証の統合
**対策**: セッション情報をCookieまたはJWTで管理

### 2. パフォーマンス
**課題**: ランキング計算の負荷
**対策**: 
- ページネーション必須
- インデックス設定
- キャッシュ戦略検討

### 3. データ整合性
**課題**: 不正スコア登録防止
**対策**:
- 入力値厳密チェック
- セッション時間検証
- 異常値検出

## 完了基準

- [ ] 全てのマイグレーションが正常実行
- [ ] 3つのAPIエンドポイントが正常動作
- [ ] 認証が必要なエンドポイントで適切な認証チェック
- [ ] エラーハンドリングが適切に動作
- [ ] Lintエラー0件
- [ ] 基本的なテストケースが通過

## 次のフェーズへの準備

Phase 1完了後、Phase 2での認証状態管理フロントエンド統合に必要な：
- ユーザー情報取得API (`GET /user/me`)
- セッション管理機能
- CORS設定確認