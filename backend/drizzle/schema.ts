import {
  AnySQLiteColumn,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  name: text().notNull(),
}, (table) => [
  uniqueIndex("users_name_unique").on(table.name),
]);
