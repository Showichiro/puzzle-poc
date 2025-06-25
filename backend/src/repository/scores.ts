import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/types";
import { scores, users } from "../db/schema";

// スコア登録
export async function createScore(
  db: Db,
  data: {
    userId: number;
    score: number;
    stage: number;
    difficulty: "easy" | "medium" | "hard";
    version: string;
    order: number;
  },
): Promise<{ id: number; ranking?: number }> {
  const result = await db
    .insert(scores)
    .values({
      user_id: data.userId,
      score: data.score,
      stage: data.stage,
      difficulty: data.difficulty,
      version: data.version,
      order: data.order,
    })
    .returning({ id: scores.id });

  const insertedId = result[0].id;

  // 登録後のランキング順位を計算
  const ranking = await getUserRanking(db, data.userId, data.difficulty);

  return { id: insertedId, ranking: ranking ?? undefined };
}

// ランキング取得
export async function getRanking(
  db: Db,
  options: {
    limit?: number;
    offset?: number;
    difficulty?: "easy" | "medium" | "hard";
    period?: "daily" | "weekly" | "monthly" | "all";
  } = {},
): Promise<{
  rankings: Array<{
    rank: number;
    username: string;
    score: number;
    stage: number;
    difficulty: string;
    created_at: string;
  }>;
  total: number;
}> {
  const { limit = 50, offset = 0, difficulty, period = "all" } = options;

  const whereConditions = [];

  if (difficulty) {
    whereConditions.push(eq(scores.difficulty, difficulty));
  }

  const periodFilter = getPeriodFilter(period);
  if (periodFilter) {
    whereConditions.push(periodFilter);
  }

  // ランキングクエリ（ROW_NUMBER()でランク計算）
  const rankingSubquery = db
    .select({
      id: scores.id,
      user_id: scores.user_id,
      score: scores.score,
      stage: scores.stage,
      difficulty: scores.difficulty,
      created_at: scores.created_at,
      username: users.name,
      rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${scores.score} DESC, ${scores.created_at} ASC)`.as(
        "rank",
      ),
    })
    .from(scores)
    .innerJoin(users, eq(scores.user_id, users.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .as("ranked_scores");

  const rankings = await db
    .select({
      rank: rankingSubquery.rank,
      username: rankingSubquery.username,
      score: rankingSubquery.score,
      stage: rankingSubquery.stage,
      difficulty: rankingSubquery.difficulty,
      created_at: rankingSubquery.created_at,
    })
    .from(rankingSubquery)
    .limit(limit)
    .offset(offset);

  // 総数取得
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(scores)
    .innerJoin(users, eq(scores.user_id, users.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const total = totalResult[0]?.count ?? 0;

  return { rankings, total };
}

// ユーザー個人スコア履歴
export async function getUserScores(
  db: Db,
  userId: number,
  options: {
    limit?: number;
    offset?: number;
  } = {},
): Promise<{
  scores: Array<{
    id: number;
    score: number;
    stage: number;
    difficulty: string;
    created_at: string;
    version: string;
    rank: number;
  }>;
  total: number;
}> {
  const { limit = 50, offset = 0 } = options;

  const userScores = await db
    .select({
      id: scores.id,
      score: scores.score,
      stage: scores.stage,
      difficulty: scores.difficulty,
      created_at: scores.created_at,
      version: scores.version,
    })
    .from(scores)
    .where(eq(scores.user_id, userId))
    .orderBy(desc(scores.created_at))
    .limit(limit)
    .offset(offset);

  const scoresWithRank = await Promise.all(
    userScores.map(async (score) => {
      const rank = await getUserRanking(
        db,
        userId,
        score.difficulty as "easy" | "medium" | "hard",
      );
      return { ...score, rank: rank ?? 0 };
    }),
  );

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(scores)
    .where(eq(scores.user_id, userId));

  const total = totalResult[0]?.count ?? 0;

  return { scores: scoresWithRank, total };
}

// ユーザーランキング順位取得
export async function getUserRanking(
  db: Db,
  userId: number,
  difficulty?: "easy" | "medium" | "hard",
): Promise<number | null> {
  const whereConditions = [eq(scores.user_id, userId)];

  if (difficulty) {
    whereConditions.push(eq(scores.difficulty, difficulty));
  }

  // ユーザーの最高スコアを取得
  const userBestScore = await db
    .select({
      score: sql<number>`MAX(${scores.score})`.as("max_score"),
      created_at: sql<string>`MIN(${scores.created_at})`.as("earliest_at"),
    })
    .from(scores)
    .where(and(...whereConditions));

  if (!userBestScore[0]?.score) {
    return null;
  }

  const bestScore = userBestScore[0].score;
  const bestScoreTime = userBestScore[0].created_at;

  // より良いスコア、または同スコアでより早い時間のユーザー数を計算
  const rankWhereConditions = [];

  if (difficulty) {
    rankWhereConditions.push(eq(scores.difficulty, difficulty));
  }

  rankWhereConditions.push(
    sql`(
      ${scores.score} > ${bestScore} OR 
      (${scores.score} = ${bestScore} AND ${scores.created_at} < ${bestScoreTime})
    )`,
  );

  const betterScoresCount = await db
    .select({ count: sql<number>`count(DISTINCT ${scores.user_id})` })
    .from(scores)
    .where(and(...rankWhereConditions));

  return (betterScoresCount[0]?.count ?? 0) + 1;
}

// SQLite用の期間フィルタ
function getPeriodFilter(period: string) {
  switch (period) {
    case "daily":
      return sql`date(${scores.created_at}) = date('now')`;
    case "weekly":
      return sql`date(${scores.created_at}) >= date('now', '-7 days')`;
    case "monthly":
      return sql`date(${scores.created_at}) >= date('now', '-1 month')`;
    default:
      return undefined;
  }
}
