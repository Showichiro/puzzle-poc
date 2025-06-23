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
  const {
    isAuthenticated,
    isLoading,
    refreshUser,
    showLoginScreen,
    setShowLoginScreen,
  } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <div className="text-gray-600 font-medium">認証状態を確認中...</div>
        </div>
      </div>
    );
  }

  // 未認証かつログイン画面表示フラグがtrueの場合のみログイン画面を表示
  if (!isAuthenticated && showLoginScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              パズルゲーム
            </h1>
            <p className="text-gray-600">スコアを記録するには認証が必要です</p>
          </div>

          {showRegister ? (
            <div>
              <Register />
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="mt-6 w-full text-center text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors duration-200"
              >
                すでにアカウントをお持ちの方はサインイン
              </button>
            </div>
          ) : (
            <div>
              <SignIn
                onSuccess={() => {
                  refreshUser();
                  setShowLoginScreen(false);
                }}
              />
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="mt-6 w-full text-center text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors duration-200"
              >
                新規アカウント作成
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowLoginScreen(false)}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              ゲストでプレイに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
