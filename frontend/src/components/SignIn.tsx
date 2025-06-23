import { useState } from "react";
import type { FC } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
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
        },
      );

      if (!optionsRes.ok) {
        throw new Error(`サインインオプション取得失敗: ${optionsRes.status}`);
      }

      const options = await optionsRes.json();

      // Step 2: WebAuthn認証実行
      const credential = await startAuthentication({
        optionsJSON: options,
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
        },
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
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">サインイン</h2>
        <p className="text-gray-600">パスキーを使用してサインインします</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        {isLoading
          ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent">
              </div>
              <span>サインイン中...</span>
            </>
          )
          : (
            <>
              <span>サインイン</span>
            </>
          )}
      </button>
    </div>
  );
};
