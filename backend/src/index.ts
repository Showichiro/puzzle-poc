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
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import type { Db } from "./db/types";
import { createUsers, findUserByName, getUserByName } from "./repository/users";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    db: Db;
  };
}>();

const route = app
  .use(logger())
  .use(
    "*",
    cors({
      origin: "http://localhost:1420",
      credentials: true,
    }),
  )
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
              ",",
            ) as AuthenticatorTransportFuture[],
          })) ?? [],
        authenticatorSelection: {
          userVerification: "preferred",
        },
      });

      await setSignedCookie(c, "challenge", option.challenge, c.env.SECRET);

      return c.json(option);
    },
  )
  .post(
    "/register-response",
    zValidator(
      "json",
      z.object({
        response: z.any(),
        username: z.string(),
        userId: z.string(),
      }),
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
        public_key: new TextDecoder().decode(
          registrationInfo.credential.publicKey,
        ),
        webauthn_user_id: userId,
        counter: registrationInfo.credential.counter,
        deviceType: registrationInfo.credentialDeviceType,
        backup: registrationInfo.credentialBackedUp ? 1 : 0,
        transport: registrationInfo.credential.transports?.join(",") ?? "",
      });

      return c.json({ success: true });
    },
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
        publicKey: new TextEncoder().encode(passkey.public_key),
        transports: passkey.transport.split(
          ",",
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
      verification.authenticationInfo.newCounter,
    );

    return c.json({ success: true });
  });

export default app;

export type AppType = typeof route;
