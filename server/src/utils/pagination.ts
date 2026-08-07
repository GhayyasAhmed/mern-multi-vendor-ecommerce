export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export function parsePagination(
  query: Record<string, unknown>,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const page = Math.max(parseInt(query.page as string) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit as string) || defaultLimit, 1), maxLimit);
  return { page, limit };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta {
  return {
    currentPage: page,
    totalPages: Math.max(Math.ceil(totalItems / limit), 1),
    totalItems,
    limit,
  };
}