import { Db } from "../db/types";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const createUsers = (db: Db, username: string) => {
  return db.insert(users).values({ name: username }).returning();
};

export const getUserByName = async (db: Db, username: string) => {
  return await db.query.users.findFirst({ where: eq(users.name, username) });
};
