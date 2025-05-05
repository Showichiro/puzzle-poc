import { eq } from "drizzle-orm";
import { Db } from "../db/types";
import { passkeys, users } from "../db/schema";

export const getUserPasskeys = (db: Db, username: string) => {
  return db.query.passkeys.findMany({ where: eq(users.name, username) });
};

export const findPasskeyByCredentialId = (db: Db, credentialId: string) => {
  return db.query.passkeys.findFirst({
    where: eq(passkeys.credential_id, credentialId),
  });
};

export const createPassKeys = (
  db: Db,
  passkey: typeof passkeys.$inferInsert,
) => {
  return db.insert(passkeys).values(passkey);
};

export const updatePasskeyCounter = (
  db: Db,
  credentialId: string,
  counter: number,
) => {
  return db
    .update(passkeys)
    .set({ counter })
    .where(eq(passkeys.credential_id, credentialId));
};
