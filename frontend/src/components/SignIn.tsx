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
        publicKey: options as unknown as PublicKeyCredentialRequestOptions,
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
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? "サインイン中..." : "サインイン"}
      </button>
    </div>
  );
};