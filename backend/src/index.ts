import {
  AuthenticatorTransportFuture,
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
  getUserPasskeys,
  updatePasskeyCounter,
} from "./repository/passkeys";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import { Db } from "./db/types";
import { createUsers, getUserByName } from "./repository/users";
import { env } from "hono/adapter";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    db: Db;
    SECRET: string;
  };
}>();

// cors を有効にする
app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(async (c, next) => {
  const client = drizzle(c.env.DB, { schema, logger: true });
  c.set("db", client);
  await next();
});

app.use(async (c, next) => {
  const { SECRET } = env<{ SECRET: string }>(c);
  c.set("SECRET", SECRET);
  await next();
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/register-request", async (c) => {
  const username = c.req.query("username");

  if (!username) {
    return c.json({ error: "Username is required" }, 400);
  }

  const passkeys = await getUserPasskeys(c.var.db, username);

  const option = await generateRegistrationOptions({
    rpID: "localhost",
    rpName: "Example RP",
    userName: username,
    timeout: 60000,
    excludeCredentials: passkeys.map((passkey) => ({
      id: passkey.credential_id,
      transports: passkey.transport.split(
        ",",
      ) as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      userVerification: "preferred",
    },
  });

  await setSignedCookie(c, "challenge", option.challenge, c.var.SECRET);

  return c.json(option);
});

app.post("/register-response", async (c) => {
  const body = await c.req.json();
  const { response, username, userId } = body;
  const { challenge } = await getSignedCookie(c, c.var.SECRET);

  if (!challenge) {
    return c.json({ error: "Challenge not found" }, 400);
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: "http://localhost:3001",
    expectedRPID: "localhost",
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
    public_key: new TextDecoder().decode(registrationInfo.credential.publicKey),
    webauthn_user_id: userId,
    counter: registrationInfo.credential.counter,
    deviceType: registrationInfo.credentialDeviceType,
    backup: registrationInfo.credentialBackedUp ? 1 : 0,
    transport: registrationInfo.credential.transports?.join(",") ?? "",
  });

  return c.json({ success: true });
});

app.get("/signin-request", async (c) => {
  const option = await generateAuthenticationOptions({
    rpID: "localhost",
    timeout: 60000,
    allowCredentials: [],
    userVerification: "preferred",
  });

  await setSignedCookie(c, "challenge", option.challenge, c.var.SECRET);

  return c.json(option);
});

app.post("/signin-response", async (c) => {
  const body = await c.req.json();
  const { challenge } = await getSignedCookie(c, c.var.SECRET);

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
    expectedOrigin: "http://localhost:3001",
    expectedRPID: "localhost",
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
