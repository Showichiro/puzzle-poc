import {
  type AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  createPassKeys,
  findPasskeyByCredentialId,
  updatePasskeyCounter,
} from "./repository/passkeys";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import type { Db } from "./db/types";
import {
  createUsers,
  findUserByName,
  getUserByName,
  getUserStats,
} from "./repository/users";
import {
  createScore,
  getRanking,
  getUserScores,
  getUserRanking,
} from "./repository/scores";
import { requireAuth, optionalAuth, type AuthUser } from "./middleware/auth";
import { validationError, authError, dbError } from "./types/errors";
import type {
  ScoreCreateResponse,
  RankingResponse,
  UserScoreResponse,
  UserMeResponse,
} from "./types/api";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    db: Db;
    user?: AuthUser;
  };
}>();

const route = app
  .use(logger())
  .use("*", async (c, next) => {
    const corsMiddlewareHandler = cors({
      origin: c.env.ORIGIN,
      credentials: true,
    });
    return corsMiddlewareHandler(c, next);
  })
  .use(async (c, next) => {
    const client = drizzle(c.env.DB, { schema, logger: true });
    c.set("db", client);
    await next();
  })
  .get(
    "/register-request",
    zValidator("query", z.object({ username: z.string() })),
    async (c) => {
      const { username } = c.req.valid("query");
      const user = await findUserByName(c.var.db, username);
      const passkeys = user?.passkeys ?? [];
      const option = await generateRegistrationOptions({
        rpID: c.env.RP_ID,
        rpName: c.env.RP_NAME,
        userName: username,
        timeout: 60000,
        excludeCredentials:
          passkeys?.map((passkey) => ({
            id: passkey.credential_id,
            transports: passkey.transport.split(
              ","
            ) as AuthenticatorTransportFuture[],
          })) ?? [],
        authenticatorSelection: {
          userVerification: "preferred",
        },
      });

      await setSignedCookie(c, "challenge", option.challenge, c.env.SECRET);

      return c.json(option);
    }
  )
  .post(
    "/register-response",
    zValidator(
      "json",
      z.object({
        response: z.any(),
        username: z.string(),
        userId: z.string(),
      })
    ),
    async (c) => {
      const { response, username, userId } = c.req.valid("json");
      const { challenge } = await getSignedCookie(c, c.env.SECRET);

      if (!challenge) {
        return c.json({ error: "Challenge not found" }, 400);
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: c.env.ORIGIN,
        expectedRPID: c.env.RP_ID,
        requireUserVerification: false,
      });

      if (!verification.verified) {
        return c.json({ error: "Verification failed" }, 400);
      }

      const { registrationInfo } = verification;

      if (!registrationInfo) {
        return c.json(500);
      }

      let user = await getUserByName(c.var.db, username);

      if (!user) {
        const created = await createUsers(c.var.db, username);
        user = created[0];
      }

      await createPassKeys(c.var.db, {
        user_id: user.id,
        credential_id: registrationInfo.credential.id,
        public_key: btoa(
          String.fromCharCode(
            ...new Uint8Array(registrationInfo.credential.publicKey)
          )
        ),
        webauthn_user_id: userId,
        counter: registrationInfo.credential.counter,
        deviceType: registrationInfo.credentialDeviceType,
        backup: registrationInfo.credentialBackedUp ? 1 : 0,
        transport: registrationInfo.credential.transports?.join(",") ?? "",
      });

      return c.json({ success: true });
    }
  )
  .get("/signin-request", async (c) => {
    const option = await generateAuthenticationOptions({
      rpID: c.env.RP_ID,
      timeout: 60000,
      allowCredentials: [],
      userVerification: "preferred",
    });

    await setSignedCookie(c, "challenge", option.challenge, c.env.SECRET);

    return c.json(option);
  })
  .post("/signin-response", async (c) => {
    const body = await c.req.json();
    const { challenge } = await getSignedCookie(c, c.env.SECRET);

    if (!challenge) {
      return c.json({ error: "Challenge not found" }, 400);
    }

    const passkey = await findPasskeyByCredentialId(c.var.db, body.id);

    if (!passkey) {
      return c.json({ error: "Passkey not found" }, 400);
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: c.env.ORIGIN,
      expectedRPID: c.env.RP_ID,
      credential: {
        counter: passkey.counter,
        id: passkey.credential_id,
        publicKey: Uint8Array.from(atob(passkey.public_key), (c) =>
          c.charCodeAt(0)
        ),
        transports: passkey.transport.split(
          ","
        ) as AuthenticatorTransportFuture[],
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return c.json({ error: "Verification failed" }, 400);
    }

    await updatePasskeyCounter(
      c.var.db,
      passkey.credential_id,
      verification.authenticationInfo.newCounter
    );

    // ユーザー情報を取得してセッションクッキーを設定
    const user = await c.var.db.query.users.findFirst({
      where: eq(users.id, passkey.user_id),
    });

    if (user) {
      await setSignedCookie(c, "user_session", user.name, c.env.SECRET);
    }

    return c.json({ success: true });
  })
  .get("/user/me", requireAuth, async (c) => {
    try {
      const user = c.var.user;

      if (!user) {
        return authError(c);
      }

      const userStats = await getUserStats(c.var.db, user.id);

      const response: UserMeResponse = {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          stats: userStats,
        },
      };

      return c.json(response);
    } catch (error) {
      console.error("User info fetch error:", error);
      return dbError(c, "Failed to fetch user info");
    }
  })
  .post("/logout", requireAuth, async (c) => {
    // セッションクッキーを削除
    c.header(
      "Set-Cookie",
      "user_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    );

    return c.json({ success: true, message: "ログアウトしました" });
  })
  .post(
    "/scores",
    zValidator(
      "json",
      z.object({
        score: z.number().int().min(0),
        stage: z.number().int().min(1).max(1000),
        difficulty: z.enum(["easy", "medium", "hard"]),
        version: z.string().min(1),
      })
    ),
    requireAuth,
    async (c) => {
      try {
        const { score, stage, difficulty, version } = c.req.valid("json");
        const user = c.var.user;

        if (!user) {
          return authError(c);
        }

        // orderを生成（簡単な実装としてタイムスタンプを使用）
        const order = Date.now();

        const result = await createScore(c.var.db, {
          userId: user.id,
          score,
          stage,
          difficulty,
          version,
          order,
        });

        const response: ScoreCreateResponse = {
          success: true,
          id: result.id,
          ranking: result.ranking,
        };

        return c.json(response);
      } catch (error) {
        console.error("Score creation error:", error);
        return dbError(c, "Failed to create score");
      }
    }
  )
  .get(
    "/scores/ranking",
    zValidator(
      "query",
      z.object({
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        period: z.enum(["daily", "weekly", "monthly", "all"]).optional(),
      })
    ),
    optionalAuth,
    async (c) => {
      try {
        const query = c.req.valid("query");
        const user = c.var.user;

        const result = await getRanking(c.var.db, query);

        let user_rank: number | undefined;
        if (user) {
          user_rank =
            (await getUserRanking(c.var.db, user.id, query.difficulty)) ??
            undefined;
        }

        const response: RankingResponse = {
          rankings: result.rankings,
          total: result.total,
          user_rank,
        };

        return c.json(response);
      } catch (error) {
        console.error("Ranking fetch error:", error);
        return dbError(c, "Failed to fetch ranking");
      }
    }
  )
  .get(
    "/scores/user/:userId",
    zValidator(
      "query",
      z.object({
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional(),
      })
    ),
    async (c) => {
      try {
        const userId = Number(c.req.param("userId"));
        const query = c.req.valid("query");

        if (Number.isNaN(userId)) {
          return validationError(c, "Invalid user ID");
        }

        const scores = await getUserScores(c.var.db, userId, query);

        const response: UserScoreResponse = {
          scores,
          total: scores.length,
        };

        return c.json(response);
      } catch (error) {
        console.error("User scores fetch error:", error);
        return dbError(c, "Failed to fetch user scores");
      }
    }
  );

export default app;

export type AppType = typeof route;
