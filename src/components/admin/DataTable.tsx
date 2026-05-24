"use client";

import React from "react";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  sortKey,
  sortOrder,
  onSort,
  pagination,
  onPageChange,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  // Generate page range for numbered pagination
  const getPageNumbers = () => {
    if (!pagination) return [];
    const { page, totalPages } = pagination;
    const delta = 2;
    const range: (number | "...")[] = [];
    const rangeWithDots: (number | "...")[] = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (range[0] && (range[0] as number) > 2) range.unshift("...");
    if (range[range.length - 1] && (range[range.length - 1] as number) < totalPages - 1) range.push("...");
    if (totalPages > 1) range.unshift(1);
    if (totalPages > 1) range.push(totalPages);

    // deduplicate
    const seen = new Set<number | string>();
    for (const p of range) {
      const key = p === "..." ? `dots-${rangeWithDots.length}` : p;
      if (!seen.has(key as number | string)) {
        seen.add(key as number | string);
        rangeWithDots.push(p);
      }
    }

    return rangeWithDots;
  };

  return (
    <div className="w-full rounded-2xl border border-white/7 bg-[#111318] shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/7 bg-white/2">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-[10px] font-bold tracking-widest text-white/40 uppercase select-none
                    ${col.sortable ? "cursor-pointer hover:text-white/70 transition-colors" : ""}
                  `}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex flex-col gap-px">
                        <svg
                          className={`w-2 h-2 transition-colors ${sortKey === col.key && sortOrder === "asc" ? "text-[#f97316]" : "text-white/20"}`}
                          fill="currentColor" viewBox="0 0 24 24"
                        >
                          <path d="M12 3l8 10H4z" />
                        </svg>
                        <svg
                          className={`w-2 h-2 transition-colors ${sortKey === col.key && sortOrder === "desc" ? "text-[#f97316]" : "text-white/20"}`}
                          fill="currentColor" viewBox="0 0 24 24"
                        >
                          <path d="M12 21l-8-10h16z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <div
                        className="h-3.5 bg-white/6 rounded-full"
                        style={{ width: `${50 + Math.random() * 40}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/4 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/30 font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="group relative hover:bg-white/2.5 transition-colors"
                >
                  {/* Left accent line on hover */}
                  <td className="relative px-5 py-4 text-xs font-medium text-white/80">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#f97316] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {columns[0].render
                      ? columns[0].render(row)
                      : (row[columns[0].key as keyof T] as React.ReactNode)}
                  </td>
                  {columns.slice(1).map((col) => (
                    <td key={col.key} className="px-5 py-4 text-xs font-medium text-white/80">
                      {col.render ? col.render(row) : (row[col.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-5 py-3.5 border-t border-white/7 bg-white/1 flex items-center justify-between gap-4 flex-wrap">
          <span className="text-[10px] font-medium text-white/30">
            {pagination.total} items · Page {pagination.page} of {pagination.totalPages}
          </span>

          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/6 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-white/20 text-xs">
                  ···
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p as number)}
                  disabled={isLoading}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all cursor-pointer
                    ${pagination.page === p
                      ? "bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20"
                      : "text-white/40 hover:text-white hover:bg-white/6"
                    }
                  `}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/6 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
