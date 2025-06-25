export interface RankingEntry {
  rank: number;
  username: string;
  score: number;
  stage: number;
  difficulty: string;
  created_at: string;
  isCurrentUser?: boolean;
}

export interface UserRankingInfo {
  rank: number;
  totalUsers: number;
  highestScore?: number;
  totalGames?: number;
  averageScore?: number;
}

export interface UserScoreEntry {
  score: number;
  stage: number;
  difficulty: string;
  rank: number;
  created_at: string;
}

export interface RankingFilters {
  difficulty: "all" | "easy" | "medium" | "hard";
  period: "all" | "daily" | "weekly" | "monthly";
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface UserStats {
  currentRank: number;
  totalUsers: number;
  highest_score: number;
  total_games: number;
  average_score: number;
}

export interface RankingResponse {
  rankings: RankingEntry[];
  total: number;
  user_rank?: number;
}

export interface UserScoreHistoryResponse {
  scores: UserScoreEntry[];
  total: number;
  stats: UserStats;
}
