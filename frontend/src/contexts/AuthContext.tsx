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
      const res = await honoClient.user.me.$get(
        {},
        {
          init: {
            credentials: "include",
          },
        }
      );

      if (res.ok) {
        const data = await res.json() as { success: boolean; user?: User };
        if (data.success && data.user) {
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
        const data = await res.json() as { success: boolean; ranking?: number };
        
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