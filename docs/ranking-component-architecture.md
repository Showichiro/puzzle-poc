# ランキング機能 コンポーネント設計・データフロー詳細仕様

## 概要

本ドキュメントは、ランキング画面機能の詳細なコンポーネント設計とデータフローを定義します。既存のアプリケーション構造に最適に統合され、保守性と拡張性を考慮した設計となっています。

## 現在のアプリケーション構造分析

### 既存コンポーネント階層
```
App.tsx
├── AuthProvider (認証状態管理)
├── AnimationSpeedProvider (アニメーション速度管理)
├── HighestScoreProvider (最高スコア管理)
└── AppContent
    ├── AuthGuard (認証チェック)
    └── Main Content
        ├── Header
        │   └── HamburgerMenu
        ├── GameBoard
        ├── StageHistoryModal (遅延ロード)
        ├── UserProfile (モーダル)
        └── WelcomeModal
```

### 既存モーダル管理パターン
現在のアプリケーションでは以下のパターンでモーダルを管理：
1. **状態管理**: AppContent内でuseStateによる表示状態管理
2. **ハンドラー**: 開閉用のハンドラー関数を定義
3. **プロップス経由**: HeaderやHamburgerMenuに関数を渡す
4. **遅延ロード**: 重いコンポーネント（StageHistoryModal）はlazy loading

## ランキング機能統合設計

### 1. 修正が必要な既存コンポーネント

#### 1.1 App.tsx の修正
```typescript
const AppContent = () => {
  // 既存状態
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  
  // 新規追加: ランキングモーダル状態
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

  // 新規追加: ランキングモーダルハンドラー
  const handleOpenRankingModal = () => {
    setIsRankingModalOpen(true);
  };

  const handleCloseRankingModal = () => {
    setIsRankingModalOpen(false);
  };

  return (
    <div className="app">
      <AuthGuard allowGuest={true}>
        <main className="container mx-auto max-w-lg p-4 flex flex-col items-center">
          <Header
            onOpenHistoryModal={handleOpenHistoryModal}
            onOpenProfile={handleOpenProfileModal}
            onOpenRanking={handleOpenRankingModal} // 新規追加
          />
          <GameBoard initialDifficulty="medium" />
          <BuyMeACoffeeLink />
        </main>
        
        {/* 既存のモーダル */}
        <Suspense fallback={<div>Loading...</div>}>
          <StageHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={handleCloseHistoryModal}
          />
        </Suspense>

        <UserProfile
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
        />

        <WelcomeModal
          isOpen={isWelcomeModalOpen}
          onClose={handleCloseWelcomeModal}
          onLogin={handleLoginFromWelcome}
        />

        {/* 新規追加: ランキングモーダル（遅延ロード） */}
        <Suspense fallback={<div>Loading...</div>}>
          <RankingModal
            isOpen={isRankingModalOpen}
            onClose={handleCloseRankingModal}
          />
        </Suspense>
      </AuthGuard>
    </div>
  );
};
```

#### 1.2 Header.tsx の修正
```typescript
interface HeaderProps {
  onOpenHistoryModal: () => void;
  onOpenProfile: () => void;
  onOpenRanking: () => void; // 新規追加
}

const Header: FC<HeaderProps> = ({ 
  onOpenHistoryModal, 
  onOpenProfile,
  onOpenRanking // 新規追加
}) => {
  // 既存のロジック...

  return (
    <header className="w-full flex justify-between items-center mb-4 p-4 bg-gray-100 rounded">
      <h1 className="text-2xl font-bold">パズルゲーム v{version}</h1>
      <div className="flex items-center">
        <HamburgerMenu
          onOpenProfile={onOpenProfile}
          onOpenHistoryModal={onOpenHistoryModal}
          onOpenInfoModal={openInfoModal}
          onOpenRanking={onOpenRanking} // 新規追加
        />
      </div>
      {/* InfoModal の既存コード... */}
    </header>
  );
};
```

#### 1.3 HamburgerMenu.tsx の修正
```typescript
interface HamburgerMenuProps {
  onOpenProfile: () => void;
  onOpenHistoryModal: () => void;
  onOpenInfoModal: () => void;
  onOpenRanking: () => void; // 新規追加
}

export const HamburgerMenu: FC<HamburgerMenuProps> = ({
  onOpenProfile,
  onOpenHistoryModal,
  onOpenInfoModal,
  onOpenRanking, // 新規追加
}) => {
  // 既存のロジック...

  const handleRankingClick = () => {
    setIsOpen(false);
    onOpenRanking();
  };

  return (
    <div className="relative">
      {/* ハンバーガーボタン: 既存コード */}
      
      {isOpen && (
        <>
          {/* オーバーレイ: 既存コード */}
          
          <motion.div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            {/* プロフィール: 既存コード（認証済みユーザーのみ） */}
            {isAuthenticated && (
              <>
                <button type="button" onClick={handleProfileClick} className="...">
                  {/* プロフィールボタン: 既存コード */}
                </button>

                {/* 新規追加: ランキングボタン */}
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
                      d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  ランキング
                </button>

                <hr className="my-2 border-gray-200" />
              </>
            )}

            {/* 既存のメニュー項目: スピード設定、ステージ履歴、ゲーム情報 */}
            {/* 既存コード... */}

            {/* 認証関連ボタン: 既存コード */}
            {/* 既存コード... */}
          </motion.div>
        </>
      )}
    </div>
  );
};
```

### 2. 新規作成コンポーネント詳細設計

#### 2.1 RankingModal.tsx (メインコンポーネント)
```typescript
import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useRanking } from '../hooks/useRanking';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

// 遅延ロード対象のコンポーネント
const RankingHeader = lazy(() => import('./RankingHeader'));
const RankingList = lazy(() => import('./RankingList'));
const UserRankingSection = lazy(() => import('./UserRankingSection'));
const PaginationControls = lazy(() => import('./PaginationControls'));

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RankingModal: FC<RankingModalProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'personal'>('global');
  
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
    fetchUserScoreHistory,
    refreshRanking
  } = useRanking();

  // 初回データ取得
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'global') {
        fetchRankingData();
      } else if (activeTab === 'personal' && isAuthenticated && user) {
        fetchUserScoreHistory(user.id);
      }
    }
  }, [isOpen, activeTab, isAuthenticated, user, fetchRankingData, fetchUserScoreHistory]);

  // フィルター変更時のデータ再取得
  useEffect(() => {
    if (isOpen && activeTab === 'global') {
      fetchRankingData();
    }
  }, [filters, pagination.currentPage, isOpen, activeTab, fetchRankingData]);

  const handleTabChange = useCallback((tab: 'global' | 'personal') => {
    setActiveTab(tab);
    // ページネーションをリセット
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [setPagination]);

  const handleFilterChange = useCallback((newFilters: Partial<RankingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // ページネーションをリセット
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [setFilters, setPagination]);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, [setPagination]);

  const handleClose = useCallback(() => {
    onClose();
    // 状態をリセット（オプション）
    setActiveTab('global');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [onClose, setActiveTab, setPagination]);

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
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* コンテンツエリア */}
            <div className="p-6">
              <Suspense fallback={<LoadingSpinner />}>
                {/* フィルター・タブヘッダー */}
                <RankingHeader
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  isAuthenticated={isAuthenticated}
                />

                {/* エラー表示 */}
                {error && (
                  <ErrorDisplay
                    error={error}
                    onRetry={activeTab === 'global' ? fetchRankingData : () => fetchUserScoreHistory(user?.id)}
                  />
                )}

                {/* メインコンテンツ */}
                {!error && (
                  <>
                    {activeTab === 'global' ? (
                      /* 全体ランキング表示 */
                      <div className="space-y-6">
                        <RankingList
                          rankings={rankings}
                          currentUserId={user?.id}
                          loading={loading}
                        />
                        
                        {/* ページネーション */}
                        {pagination.totalPages > 1 && (
                          <PaginationControls
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                            loading={loading}
                          />
                        )}
                      </div>
                    ) : (
                      /* 個人記録表示 */
                      isAuthenticated ? (
                        <UserRankingSection
                          userRanking={userRanking}
                          userScoreHistory={userScoreHistory}
                          loading={loading}
                          filters={filters}
                          pagination={pagination}
                          onPageChange={handlePageChange}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-500">ログインして個人記録を確認してください</p>
                        </div>
                      )
                    )}
                  </>
                )}
              </Suspense>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default RankingModal;
```

#### 2.2 useRanking.ts (カスタムフック)
```typescript
import { useState, useCallback, useRef } from 'react';
import { fetchRanking, fetchUserScoreHistory } from '../utils/ranking-api';
import type { 
  RankingEntry, 
  UserRankingInfo, 
  UserScoreEntry, 
  RankingFilters, 
  PaginationInfo 
} from '../types/ranking';

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
  fetchUserScoreHistory: (userId: string) => Promise<void>;
  refreshRanking: () => Promise<void>;
}

export function useRanking(): UseRankingReturn {
  // 状態管理
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [userRanking, setUserRanking] = useState<UserRankingInfo | null>(null);
  const [userScoreHistory, setUserScoreHistory] = useState<UserScoreEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<RankingFilters>({
    difficulty: 'all',
    period: 'all'
  });
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // 重複リクエスト防止
  const abortControllerRef = useRef<AbortController | null>(null);

  // エラーハンドリング
  const handleError = useCallback((err: unknown) => {
    console.error('Ranking fetch error:', err);
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('予期しないエラーが発生しました');
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
        ...(filters.difficulty !== 'all' && { difficulty: filters.difficulty }),
        ...(filters.period !== 'all' && { period: filters.period })
      };

      const response = await fetchRanking(params, {
        signal: abortControllerRef.current.signal
      });

      setRankings(response.rankings);
      
      // ユーザーランキング情報があれば設定
      if (response.user_rank !== undefined) {
        setUserRanking({
          rank: response.user_rank,
          totalUsers: response.total
        });
      }

      // ページネーション情報更新
      setPagination(prev => ({
        ...prev,
        totalItems: response.total,
        totalPages: Math.ceil(response.total / prev.itemsPerPage)
      }));

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        handleError(err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage, handleError]);

  // ユーザースコア履歴取得
  const fetchUserScoreHistory = useCallback(async (userId: string) => {
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
        ...(filters.difficulty !== 'all' && { difficulty: filters.difficulty }),
        ...(filters.period !== 'all' && { period: filters.period })
      };

      const response = await fetchUserScoreHistory(userId, params, {
        signal: abortControllerRef.current.signal
      });

      setUserScoreHistory(response.scores);
      
      // ユーザー統計情報があれば設定
      if (response.stats) {
        setUserRanking({
          rank: response.stats.currentRank,
          totalUsers: response.stats.totalUsers,
          highestScore: response.stats.highestScore,
          totalGames: response.stats.totalGames,
          averageScore: response.stats.averageScore
        });
      }

      // ページネーション情報更新
      setPagination(prev => ({
        ...prev,
        totalItems: response.total,
        totalPages: Math.ceil(response.total / prev.itemsPerPage)
      }));

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        handleError(err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage, handleError]);

  // データ再取得
  const refreshRanking = useCallback(async () => {
    // 現在のページを1にリセットして再取得
    setPagination(prev => ({ ...prev, currentPage: 1 }));
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
    fetchUserScoreHistory,
    refreshRanking
  };
}
```

#### 2.3 ranking-api.ts (API統合レイヤー)
```typescript
import { hc } from 'hono/client';
import type { AppType } from '../../backend/src/index';

// バックエンドAPIクライアント
const client = hc<AppType>(import.meta.env.VITE_API_URL || 'http://localhost:8787');

// 型定義
export interface RankingParams {
  limit?: number;
  offset?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  period?: 'daily' | 'weekly' | 'monthly' | 'all';
}

export interface RankingEntry {
  rank: number;
  username: string;
  score: number;
  stage: number;
  difficulty: string;
  created_at: string;
  isCurrentUser?: boolean;
}

export interface RankingResponse {
  rankings: RankingEntry[];
  total: number;
  user_rank?: number;
}

export interface UserScoreEntry {
  score: number;
  stage: number;
  difficulty: string;
  rank: number;
  created_at: string;
}

export interface UserStats {
  currentRank: number;
  totalUsers: number;
  highestScore: number;
  totalGames: number;
  averageScore: number;
}

export interface UserScoreHistoryResponse {
  scores: UserScoreEntry[];
  total: number;
  stats: UserStats;
}

// エラーハンドリング
class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

// 全体ランキング取得
export async function fetchRanking(
  params: RankingParams = {},
  options?: RequestInit
): Promise<RankingResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params.period) searchParams.set('period', params.period);

    const response = await client.scores.ranking.$get(
      { query: Object.fromEntries(searchParams) },
      { ...options }
    );

    if (!response.ok) {
      throw new APIError(
        'ランキングの取得に失敗しました',
        response.status
      );
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new APIError(data.error || 'ランキングの取得に失敗しました');
    }

    return {
      rankings: data.rankings.map((item: any, index: number) => ({
        rank: index + 1 + (params.offset || 0),
        username: item.username,
        score: item.score,
        stage: item.stage,
        difficulty: item.difficulty,
        created_at: item.created_at,
        isCurrentUser: item.isCurrentUser
      })),
      total: data.total,
      user_rank: data.user_rank
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    
    throw new APIError('ネットワークエラーが発生しました');
  }
}

// ユーザースコア履歴取得
export async function fetchUserScoreHistory(
  userId: string,
  params: RankingParams = {},
  options?: RequestInit
): Promise<UserScoreHistoryResponse> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params.period) searchParams.set('period', params.period);

    const response = await client.scores.user[':userId'].$get(
      { 
        param: { userId },
        query: Object.fromEntries(searchParams)
      },
      { ...options }
    );

    if (!response.ok) {
      throw new APIError(
        'スコア履歴の取得に失敗しました',
        response.status
      );
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new APIError(data.error || 'スコア履歴の取得に失敗しました');
    }

    return {
      scores: data.scores,
      total: data.total,
      stats: data.stats
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    
    throw new APIError('ネットワークエラーが発生しました');
  }
}
```

### 3. データフロー図

#### 3.1 全体的なデータフロー
```
┌─────────────────────────────────────────────────────────────────┐
│                        App Component                            │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│ │ AuthContext │  │ UserContext  │  │   Modal State Mgmt      │  │
│ │             │  │              │  │                         │  │
│ │ - auth state│  │ - user info  │  │ - ranking modal open    │  │
│ │ - login/out │  │ - user stats │  │ - history modal open    │  │
│ └─────────────┘  └──────────────┘  │ - profile modal open    │  │
│        │                │          └─────────────────────────┘  │
│        │                │                        │              │
│        v                v                        v              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                 HamburgerMenu                                │ │
│ │                                                             │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────────┐    │ │
│ │ │Profile  │ │Ranking  │ │History  │ │    Settings      │    │ │
│ │ │Button   │ │Button   │ │Button   │ │                  │    │ │
│ │ └─────────┘ └─────────┘ └─────────┘ └──────────────────┘    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           v                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                 RankingModal                                │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │                useRanking Hook                          │ │ │
│ │ │                                                         │ │ │
│ │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│ │ │
│ │ │ │   State     │ │   Actions   │ │   API Integration   ││ │ │
│ │ │ │             │ │             │ │                     ││ │ │
│ │ │ │- rankings   │ │- fetch      │ │- fetchRanking()     ││ │ │
│ │ │ │- loading    │ │- refresh    │ │- fetchUserHistory() ││ │ │
│ │ │ │- error      │ │- filter     │ │- error handling     ││ │ │
│ │ │ │- filters    │ │- paginate   │ │- caching           ││ │ │
│ │ │ └─────────────┘ └─────────────┘ └─────────────────────┘│ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                           │                                 │ │
│ │                           v                                 │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │              Sub Components                             │ │ │
│ │ │                                                         │ │ │
│ │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│ │ │
│ │ │ │RankingList  │ │UserRanking  │ │   Pagination        ││ │ │
│ │ │ │             │ │Section      │ │   Controls          ││ │ │
│ │ │ │- render     │ │             │ │                     ││ │ │
│ │ │ │  rankings   │ │- render     │ │- page navigation    ││ │ │
│ │ │ │- highlight  │ │  user stats │ │- loading states     ││ │ │
│ │ │ │  current    │ │- render     │ │                     ││ │ │
│ │ │ │  user       │ │  history    │ │                     ││ │ │
│ │ │ └─────────────┘ └─────────────┘ └─────────────────────┘│ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2 API呼び出しフロー
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Action    │    │   useRanking    │    │   ranking-api   │
│                 │    │      Hook       │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - Open Modal    │───▶│ - setLoading    │───▶│ - Fetch Data    │
│ - Change Filter │    │ - clearError    │    │ - Handle Error  │
│ - Change Page   │    │                 │    │ - Transform     │
│                 │    │                 │    │   Response      │
│                 │    │                 │◀───│                 │
│                 │    │ - setRankings   │    │                 │
│                 │◀───│ - setLoading    │    │                 │
│ - Render UI     │    │ - setError      │    │                 │
│ - Show Loading  │    │                 │    │                 │
│ - Show Error    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## パフォーマンス最適化戦略

### 1. 遅延ローディング
```typescript
// メインモーダルの遅延ロード
const RankingModal = lazy(() => import('./components/RankingModal'));

// サブコンポーネントの遅延ロード
const RankingHeader = lazy(() => import('./RankingHeader'));
const RankingList = lazy(() => import('./RankingList'));
const UserRankingSection = lazy(() => import('./UserRankingSection'));
```

### 2. メモ化戦略
```typescript
// コンポーネントメモ化
export const RankingList = memo(({ rankings, currentUserId, loading }) => {
  // レンダリングロジック
});

// 計算コストの高い処理のメモ化
const sortedRankings = useMemo(() => {
  return rankings.sort((a, b) => a.rank - b.rank);
}, [rankings]);

// コールバック関数のメモ化
const handlePageChange = useCallback((page: number) => {
  setPagination(prev => ({ ...prev, currentPage: page }));
}, [setPagination]);
```

### 3. 仮想化（大量データ対応）
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedRankingList = ({ rankings }) => (
  <List
    height={400}
    itemCount={rankings.length}
    itemSize={60}
    itemData={rankings}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <RankingItem ranking={data[index]} />
      </div>
    )}
  </List>
);
```

### 4. API最適化
```typescript
// デバウンス機能
const debouncedFetchRanking = useMemo(
  () => debounce(fetchRankingData, 300),
  [fetchRankingData]
);

// キャッシュ機能
const cacheKey = `ranking-${JSON.stringify(filters)}-${pagination.currentPage}`;
const cachedData = useMemo(() => {
  return cache.get(cacheKey);
}, [cacheKey]);
```

## エラーハンドリング戦略

### 1. エラー境界 (Error Boundary)
```typescript
class RankingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

### 2. 段階的エラー回復
```typescript
const handleApiError = (error: Error) => {
  if (error.name === 'NetworkError') {
    // ネットワークエラー: リトライ可能
    setError({ 
      type: 'network', 
      message: '接続エラーが発生しました',
      retryable: true 
    });
  } else if (error.name === 'AuthError') {
    // 認証エラー: ログイン画面表示
    setError({
      type: 'auth',
      message: 'ログインが必要です',
      retryable: false
    });
    setShowLoginScreen(true);
  } else {
    // その他のエラー: 一般的なエラー表示
    setError({
      type: 'general',
      message: 'エラーが発生しました',
      retryable: true
    });
  }
};
```

## テスト戦略

### 1. ユニットテスト (Jest + React Testing Library)
```typescript
// useRanking フックのテスト
describe('useRanking', () => {
  test('should fetch ranking data successfully', async () => {
    const { result } = renderHook(() => useRanking());
    
    await act(async () => {
      await result.current.fetchRankingData();
    });

    expect(result.current.rankings).toHaveLength(20);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should handle API errors correctly', async () => {
    // API エラーをモック
    mockFetchRanking.mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useRanking());
    
    await act(async () => {
      await result.current.fetchRankingData();
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.loading).toBe(false);
  });
});
```

### 2. 統合テスト
```typescript
// RankingModal コンポーネントの統合テスト
describe('RankingModal Integration', () => {
  test('should display rankings when opened', async () => {
    render(
      <AuthProvider>
        <RankingModal isOpen={true} onClose={jest.fn()} />
      </AuthProvider>
    );

    expect(screen.getByText('ランキング')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('PlayerOne')).toBeInTheDocument();
    });
  });

  test('should filter rankings by difficulty', async () => {
    render(
      <AuthProvider>
        <RankingModal isOpen={true} onClose={jest.fn()} />
      </AuthProvider>
    );

    const difficultySelect = screen.getByLabelText('難易度');
    fireEvent.change(difficultySelect, { target: { value: 'hard' } });

    await waitFor(() => {
      expect(mockFetchRanking).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: 'hard' })
      );
    });
  });
});
```

### 3. E2Eテスト (Playwright)
```typescript
// ランキング機能のE2Eテスト
test('ranking feature end-to-end', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.click('[data-testid="login-button"]');
  
  // ハンバーガーメニューを開く
  await page.click('[data-testid="hamburger-menu"]');
  
  // ランキングを開く
  await page.click('[data-testid="ranking-menu-item"]');
  
  // ランキングモーダルが表示されることを確認
  await expect(page.locator('[data-testid="ranking-modal"]')).toBeVisible();
  
  // ランキングデータが表示されることを確認
  await expect(page.locator('[data-testid="ranking-list"]')).toBeVisible();
  
  // フィルタリング機能をテスト
  await page.selectOption('[data-testid="difficulty-filter"]', 'hard');
  await expect(page.locator('[data-testid="ranking-list"]')).toBeVisible();
  
  // ページネーション機能をテスト
  await page.click('[data-testid="next-page-button"]');
  await expect(page.locator('[data-testid="page-2"]')).toHaveClass('active');
});
```

## 実装チェックリスト

### Phase 1: 基本実装
- [ ] App.tsx にランキングモーダル状態追加
- [ ] Header.tsx にランキングハンドラー追加
- [ ] HamburgerMenu.tsx にランキングボタン追加
- [ ] RankingModal基本構造作成
- [ ] useRanking フック基本実装
- [ ] ranking-api.ts 基本実装

### Phase 2: UI完成
- [ ] RankingList コンポーネント作成
- [ ] RankingHeader コンポーネント作成
- [ ] UserRankingSection コンポーネント作成
- [ ] PaginationControls コンポーネント作成
- [ ] LoadingSpinner コンポーネント作成
- [ ] ErrorDisplay コンポーネント作成

### Phase 3: 機能完成
- [ ] フィルタリング機能実装
- [ ] ページネーション機能実装
- [ ] エラーハンドリング実装
- [ ] レスポンシブデザイン実装
- [ ] アクセシビリティ対応

### Phase 4: 最適化・テスト
- [ ] 遅延ローディング実装
- [ ] メモ化最適化実装
- [ ] ユニットテスト実装
- [ ] 統合テスト実装
- [ ] E2Eテスト実装
- [ ] パフォーマンステスト実施

この詳細設計に基づいて、段階的にランキング機能を実装していきます。各段階で動作確認を行い、必要に応じて設計を調整します。