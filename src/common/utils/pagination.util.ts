import { PaginationMeta, PaginationParams } from '../types/pagination.types';

export const parsePagination = (query: { page?: unknown; limit?: unknown }): PaginationParams => {
  const parsedPage = parseInt(String(query.page), 10);
  const parsedLimit = parseInt(String(query.limit), 10);

  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;

  // Enforce max limit of 100
  if (limit > 100) {
    limit = 100;
  }

  return { page, limit };
};

export const buildPaginationMeta = (total: number, page: number, limit: number): PaginationMeta => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages
  };
};
