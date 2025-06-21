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
              type="button"
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
              type="button"
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