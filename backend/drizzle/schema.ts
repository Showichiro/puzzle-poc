import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  name: text().notNull(),
}, (table) => [
  uniqueIndex("users_name_unique").on(table.name),
]);

export const passkeys = sqliteTable("passkeys", {
  credentialId: text("credential_id").primaryKey().notNull(),
  webauthnUserId: text("webauthn_user_id").notNull(),
  publicKey: text("public_key").notNull(),
  deviceType: text().notNull(),
  counter: integer().notNull(),
  backup: integer().notNull(),
  transport: text().notNull(),
  userId: integer("user_id").notNull(),
});
