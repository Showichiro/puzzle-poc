import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
});

export const passkeys = sqliteTable("passkeys", {
  credential_id: text().primaryKey(),
  webauthn_user_id: text().notNull(),
  public_key: text().notNull(),
  deviceType: text().notNull(),
  counter: int().notNull(),
  backup: int().notNull(),
  transport: text().notNull(),
  user_id: int().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  passkeys: many(passkeys),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  users: one(users, {
    fields: [passkeys.user_id],
    references: [users.id],
  }),
}));
