import { useForm } from "@tanstack/react-form";
import type { FC } from "react";
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
        const webauthnResponse = await navigator.credentials.create({
          publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options),
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="username">
        {(field) => {
          return (
            <>
              <label htmlFor={field.name}>ユーザー名</label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                autoComplete="username webauthn"
              />
            </>
          );
        }}
      </form.Field>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "..." : "Submit"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
};
