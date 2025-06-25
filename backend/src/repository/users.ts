import type { Db } from "../db/types";
import { users, scores } from "../db/schema";
import { eq, sql, and } from "drizzle-orm";
import { getUserRanking } from "./scores";

export const createUsers = (db: Db, username: string) => {
  return db.insert(users).values({ name: username }).returning();
};

export const getUserByName = async (db: Db, username: string) => {
  return await db.query.users.findFirst({ where: eq(users.name, username) });
};

export const findUserByName = (db: Db, username: string) => {
  return db.query.users.findFirst({
    where: eq(users.name, username),
    with: {
      passkeys: true,
    },
  });
};

export async function getUserStats(
  db: Db,
  userId: number,
): Promise<{
  total_games: number;
  highest_score: number;
  highest_stage: number;
  average_score: number;
  recent_game_count: number;
  currentRank: number;
  totalUsers: number;
}> {
  const stats = await db
    .select({
      total_games: sql<number>`COUNT(*)`,
      highest_score: sql<number>`MAX(score)`,
      highest_stage: sql<number>`MAX(stage)`,
      average_score: sql<number>`AVG(score)`,
    })
    .from(scores)
    .where(eq(scores.user_id, userId))
    .get();

  const recentCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(scores)
    .where(
      and(
        eq(scores.user_id, userId),
        sql`date(created_at) >= date('now', '-7 days')`,
      ),
    )
    .get();

  const currentRank = await getUserRanking(db, userId);
  const totalUsersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  const totalUsers = totalUsersResult[0]?.count ?? 0;

  return {
    total_games: stats?.total_games || 0,
    highest_score: stats?.highest_score || 0,
    highest_stage: stats?.highest_stage || 0,
    average_score: Math.round(stats?.average_score || 0),
    recent_game_count: recentCount?.count || 0,
    currentRank: currentRank ?? 0,
    totalUsers: totalUsers,
  };
}
