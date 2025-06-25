import { useState } from "react";
import type { RankingFilters, PaginationInfo } from "../types/ranking";

export function useRanking() {
  // 状態管理
  const [filters, setFilters] = useState<RankingFilters>({
    difficulty: "all",
    period: "all",
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  return {
    filters,
    pagination,
    setFilters,
    setPagination,
  };
}
