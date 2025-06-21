# Phase 2 実装計画詳細 - 認証状態管理とフロントエンド統合

## 現在の実装状況分析

### 🟢 完了済み（Phase 1）
- **バックエンド認証基盤**: WebAuthn認証、スコアAPI、認証ミドルウェア完全実装済み
- **セッション管理**: Cookie-based セッション管理（`user_session`）実装済み
- **型安全性**: Hono RPC による型安全なAPI通信実装済み
- **フロントエンド登録機能**: `Register.tsx`でWebAuthn登録実装済み
- **Contextパターン**: `AnimationSpeedContext`, `HighestScoreContext`でState管理実装済み

### 🔴 Phase 2 で実装する機能
1. **バックエンド**: `GET /user/me` API実装
2. **フロントエンド**: サインイン機能実装
3. **フロントエンド**: 認証状態管理Context実装
4. **フロントエンド**: ゲーム統合（認証チェック、スコア投稿）

## Phase 2 実装タスク詳細

### 2.1 バックエンド API拡張

#### 2.1.1 ユーザー情報取得API実装
**ファイル**: `backend/src/index.ts`

**追加するエンドポイント**:
```typescript
.get("/user/me", requireAuth, async (c) => {
  try {
    const user = c.var.user;
    
    if (!user) {
      return authError(c);
    }

    // ユーザーの詳細情報を取得（スコア統計を含む）
    const userStats = await getUserStats(c.var.db, user.id);

    return c.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        stats: userStats,
      },
    });
  } catch (error) {
    console.error("User info fetch error:", error);
    return dbError(c, "Failed to fetch user info");
  }
})
```

#### 2.1.2 ユーザー統計取得Repository実装
**ファイル**: `backend/src/repository/users.ts`（拡張）

**追加する関数**:
```typescript
export async function getUserStats(
  db: Db,
  userId: number
): Promise<{
  total_games: number;
  highest_score: number;
  highest_stage: number;
  average_score: number;
  recent_game_count: number;
}> {
  const stats = await db
    .select({
      total_games: sql<number>`COUNT(*)`,
      highest_score: sql<number>`MAX(score)`,
      highest_stage: sql<number>`MAX(stage)`,
      average_score: sql<number>`AVG(score)`,
    })
    .from(scores)
    .where(eq(scores.user_id, userId))
    .get();

  const recentCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(scores)
    .where(
      and(
        eq(scores.user_id, userId),
        sql`date(created_at) >= date('now', '-7 days')`
      )
    )
    .get();

  return {
    total_games: stats?.total_games || 0,
    highest_score: stats?.highest_score || 0,
    highest_stage: stats?.highest_stage || 0,
    average_score: Math.round(stats?.average_score || 0),
    recent_game_count: recentCount?.count || 0,
  };
}
```

#### 2.1.3 API型定義拡張
**ファイル**: `backend/src/types/api.ts`（拡張）

```typescript
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
```

### 2.2 フロントエンド サインイン機能実装

#### 2.2.1 サインインコンポーネント作成
**ファイル**: `frontend/src/components/SignIn.tsx`

```typescript
import { useState } from "react";
import type { FC } from "react";
import { honoClient } from "../utils/hono-client";

export const SignIn: FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: サインインオプション取得
      const optionsRes = await honoClient["signin-request"].$get(
        {},
        {
          init: {
            credentials: "include",
          },
        }
      );

      if (!optionsRes.ok) {
        throw new Error(`サインインオプション取得失敗: ${optionsRes.status}`);
      }

      const options = await optionsRes.json();

      // Step 2: WebAuthn認証実行
      const credential = await navigator.credentials.get({
        publicKey: options,
      });

      if (!credential) {
        throw new Error("認証がキャンセルされました");
      }

      // Step 3: サインイン検証
      const signInRes = await honoClient["signin-response"].$post(
        {
          json: credential,
        },
        {
          init: {
            credentials: "include",
          },
        }
      );

      if (!signInRes.ok) {
        throw new Error("サインイン検証に失敗しました");
      }

      const result = await signInRes.json();

      if (result.success) {
        onSuccess();
      } else {
        throw new Error("サインインに失敗しました");
      }
    } catch (err) {
      console.error("SignIn error:", err);
      setError(err instanceof Error ? err.message : "サインインに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <h2>サインイン</h2>
      <p>パスキーを使用してサインインします</p>
      
      {error && (
        <div className="error-message text-red-500 mb-4">
          {error}
        </div>
      )}
      
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? "サインイン中..." : "サインイン"}
      </button>
    </div>
  );
};
```

### 2.3 認証状態管理Context実装

#### 2.3.1 認証Context作成
**ファイル**: `frontend/src/contexts/AuthContext.tsx`

```typescript
import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { honoClient } from "../utils/hono-client";

interface User {
  id: number;
  name: string;
  stats: {
    total_games: number;
    highest_score: number;
    highest_stage: number;
    average_score: number;
    recent_game_count: number;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  submitScore: (scoreData: {
    score: number;
    stage: number;
    difficulty: 'easy' | 'medium' | 'hard';
    version: string;
  }) => Promise<{ success: boolean; ranking?: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザー情報取得
  const fetchUser = useCallback(async (): Promise<boolean> => {
    try {
      const res = await honoClient["user"]["me"].$get(
        {},
        {
          init: {
            credentials: "include",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          return true;
        }
      }
      
      setUser(null);
      return false;
    } catch (error) {
      console.error("User fetch error:", error);
      setUser(null);
      return false;
    }
  }, []);

  // 初回ロード時の認証状態確認
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await fetchUser();
      setIsLoading(false);
    };

    checkAuth();
  }, [fetchUser]);

  // サインアウト
  const signOut = useCallback(async () => {
    try {
      // セッションCookieをクリア（サーバーサイドでエンドポイント追加する場合）
      // 現在はクライアントサイドでのみクリア
      setUser(null);
      
      // 必要に応じてlocalStorageもクリア
      localStorage.removeItem('user_session');
      
      // ページリロードして確実にセッションクリア
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  // ユーザー情報更新
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  // スコア投稿
  const submitScore = useCallback(async (scoreData: {
    score: number;
    stage: number;
    difficulty: 'easy' | 'medium' | 'hard';
    version: string;
  }): Promise<{ success: boolean; ranking?: number }> => {
    try {
      const res = await honoClient.scores.$post(
        {
          json: scoreData,
        },
        {
          init: {
            credentials: "include",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        
        // スコア投稿後にユーザー統計を更新
        await refreshUser();
        
        return {
          success: data.success,
          ranking: data.ranking,
        };
      }

      return { success: false };
    } catch (error) {
      console.error("Score submit error:", error);
      return { success: false };
    }
  }, [refreshUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshUser,
    submitScore,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

### 2.4 認証統合コンポーネント実装

#### 2.4.1 認証ゲート（Guard）コンポーネント
**ファイル**: `frontend/src/components/AuthGuard.tsx`

```typescript
import type { FC, ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SignIn } from "./SignIn";
import { Register } from "./Register";
import { useState } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard: FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          認証状態を確認中...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        {showRegister ? (
          <div>
            <Register />
            <button
              onClick={() => setShowRegister(false)}
              className="link-button mt-4"
            >
              すでにアカウントをお持ちの方はサインイン
            </button>
          </div>
        ) : (
          <div>
            <SignIn onSuccess={refreshUser} />
            <button
              onClick={() => setShowRegister(true)}
              className="link-button mt-4"
            >
              新規アカウント作成
            </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
```

### 2.5 ゲーム統合の実装

#### 2.5.1 ゲームオーバー時のスコア投稿
**ファイル**: `frontend/src/components/GameOverModal.tsx`（修正）

```typescript
// 既存のGameOverModalコンポーネントに認証機能を統合

import { useAuth } from "../contexts/AuthContext";

// GameOverModal内でのスコア投稿処理を追加
const { submitScore, user } = useAuth();

const handleScoreSubmit = async () => {
  if (!user) return;

  const scoreData = {
    score: finalScore,
    stage: currentStage,
    difficulty: currentDifficulty,
    version: "1.0.0", // アプリのバージョン
  };

  const result = await submitScore(scoreData);
  
  if (result.success) {
    // スコア投稿成功時の処理
    console.log("スコア投稿成功", result.ranking && `ランキング: ${result.ranking}位`);
  }
};
```

#### 2.5.2 ユーザー情報表示コンポーネント
**ファイル**: `frontend/src/components/UserProfile.tsx`

```typescript
import type { FC } from "react";
import { useAuth } from "../contexts/AuthContext";

export const UserProfile: FC = () => {
  const { user, signOut, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        <h3>{user.name}</h3>
        <div className="user-stats">
          <div>総ゲーム数: {user.stats.total_games}</div>
          <div>最高スコア: {user.stats.highest_score}</div>
          <div>最高ステージ: {user.stats.highest_stage}</div>
          <div>平均スコア: {user.stats.average_score}</div>
          <div>今週のプレイ: {user.stats.recent_game_count}回</div>
        </div>
      </div>
      <button onClick={signOut} className="btn-secondary">
        サインアウト
      </button>
    </div>
  );
};
```

### 2.6 App.tsx統合

#### 2.6.1 プロバイダー統合
**ファイル**: `frontend/src/App.tsx`（修正）

```typescript
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { UserProfile } from "./components/UserProfile";

function App() {
  return (
    <AuthProvider>
      <AnimationSpeedProvider>
        <HighestScoreProvider>
          <div className="app">
            <AuthGuard>
              <Header />
              <UserProfile />
              <GameBoard />
              {/* その他のコンポーネント */}
            </AuthGuard>
          </div>
        </HighestScoreProvider>
      </AnimationSpeedProvider>
    </AuthProvider>
  );
}
```

## 実装順序と時間見積もり

### 1. バックエンドAPI拡張 (60分)
- [ ] `GET /user/me` エンドポイント実装 (30分)
- [ ] `getUserStats` Repository関数実装 (20分)
- [ ] 型定義追加 (10分)

### 2. フロントエンド認証コンポーネント (90分)
- [ ] `SignIn.tsx` コンポーネント作成 (30分)
- [ ] `AuthContext.tsx` 状態管理実装 (45分)
- [ ] `AuthGuard.tsx` 認証ゲート実装 (15分)

### 3. ゲーム統合 (90分)
- [ ] `UserProfile.tsx` ユーザー情報表示 (20分)
- [ ] `GameOverModal.tsx` スコア投稿統合 (30分)
- [ ] `App.tsx` プロバイダー統合 (20分)
- [ ] 既存コンポーネントの認証統合 (20分)

### 4. テスト・デバッグ (60分)
- [ ] 認証フロー動作確認 (20分)
- [ ] スコア投稿動作確認 (20分)
- [ ] UI/UX調整 (20分)

**総計**: 約5-6時間

## セキュリティ考慮事項

### 2.1 フロントエンド
- セッション情報はメモリ内のみ保持（localStorage使用しない）
- 認証状態の確認は常にサーバーサイドで実行
- 機密情報はクライアントサイドに保存しない

### 2.2 エラーハンドリング
- 認証エラー時の適切なメッセージ表示
- セッション切れ時の自動再認証プロンプト
- ネットワークエラー時のリトライ機能

## 完了基準

### 機能要件
- [ ] ユーザー登録からサインインまでのフローが完全動作
- [ ] ゲーム中の認証状態が適切に管理される
- [ ] スコア投稿が認証状態と連動して動作
- [ ] ユーザー情報・統計が正しく表示される

### 品質要件
- [ ] TypeScript型エラー 0件
- [ ] Lint エラー 0件
- [ ] ゲーム機能の既存動作に影響なし
- [ ] 認証なしでアプリがクラッシュしない

## Phase 3 への準備

Phase 2 完了後、以下の機能がPhase 3で実装可能になります:

- **ランキング表示機能**: 認証済みユーザーのランキング表示
- **リアルタイム更新**: ユーザー統計のリアルタイム更新
- **ソーシャル機能**: 友達との競争機能
- **実績システム**: ゲーム実績とバッジ機能

## 潜在的な課題と解決策

### 1. セッション管理
**課題**: ブラウザ再起動時のセッション継続
**解決策**: HttpOnly Cookieによる自動セッション復元

### 2. UX向上
**課題**: 認証が必要なことがゲームプレイを妨げる
**解決策**: 非認証でもゲーム可能、スコア投稿時のみ認証要求

### 3. パフォーマンス
**課題**: ユーザー情報の頻繁な取得
**解決策**: Context内でのキャッシュ機能とSWR パターンの適用

この実装計画により、Phase 2が完了すると、完全に統合された認証システムとゲームシステムが実現されます。