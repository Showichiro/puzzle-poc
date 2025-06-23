import { useForm } from "@tanstack/react-form";
import type { FC } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { honoClient } from "../utils/hono-client";

export const Register: FC = () => {
  const form = useForm({
    defaultValues: {
      username: "",
    },
    onSubmit: async ({ value: { username } }) => {
      try {
        const res = await honoClient["register-request"].$get(
          {
            query: { username },
          },
          {
            init: {
              credentials: "include",
            },
          },
        );
        if (!res.ok) {
          throw new Error(`response: ${res.status} ${res.statusText}`);
        }
        const options = await res.json();
        const webauthnResponse = await startRegistration({
          optionsJSON: options,
        });
        console.log(webauthnResponse);

        const result = await honoClient["register-response"].$post(
          {
            json: {
              response: webauthnResponse,
              username,
              userId: options.user.id,
            },
          },
          {
            init: {
              credentials: "include",
            },
          },
        );
        if (result.ok) {
          alert("登録できました。");
        } else {
          alert("登録できませんでした。");
        }
      } catch (e) {
        console.error(e);
      }
    },
  });
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">アカウント作成</h2>
        <p className="text-gray-600">パスキーを使用して新しいアカウントを作成します</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="username">
          {(field) => {
            return (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">
                  ユーザー名
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  autoComplete="username webauthn"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="ユーザー名を入力してください"
                />
              </div>
            );
          }}
        </form.Field>
        
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button 
              type="submit" 
              disabled={!canSubmit}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>登録中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>アカウント作成</span>
                </>
              )}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
};
