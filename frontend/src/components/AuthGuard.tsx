import type { FC, ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { SignIn } from "./SignIn";
import { Register } from "./Register";
import { useState } from "react";

interface AuthGuardProps {
  children: ReactNode;
  allowGuest?: boolean;
}

export const AuthGuard: FC<AuthGuardProps> = ({
  children,
  allowGuest = false,
}) => {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">認証状態を確認中...</div>
      </div>
    );
  }

  if (!isAuthenticated && !guestMode) {
    return (
      <div className="auth-container max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">パズルゲーム</h1>

        {showRegister ? (
          <div>
            <Register />
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="link-button mt-4 w-full text-center"
            >
              すでにアカウントをお持ちの方はサインイン
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center text-gray-600">
              <p className="mb-2">スコアを記録するには認証が必要です</p>
            </div>

            <SignIn onSuccess={refreshUser} />
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="link-button mt-4 w-full text-center"
            >
              新規アカウント作成
            </button>
          </div>
        )}

        {allowGuest && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-4">
              ※ゲストプレイも可能ですが、スコアは保存されません
            </p>
            <button
              type="button"
              onClick={() => setGuestMode(true)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ゲストでプレイ
            </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
