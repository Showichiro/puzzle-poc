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
  scores: many(scores),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, {
    fields: [passkeys.user_id],
    references: [users.id],
  }),
}));

export const scores = sqliteTable("scores", {
  id: int().primaryKey({ autoIncrement: true }),
  user_id: int().notNull(),
  version: text().notNull(),
  order: int().notNull(),
  score: int().notNull().default(0),
  stage: int().notNull().default(1),
  difficulty: text().notNull().default("medium"), // 'easy' | 'medium' | 'hard'
  created_at: text().notNull().default("CURRENT_TIMESTAMP"),
});

export const scoresRelations = relations(scores, ({ one }) => {
  return {
    user: one(users, {
      fields: [scores.user_id],
      references: [users.id],
    }),
  };
});
