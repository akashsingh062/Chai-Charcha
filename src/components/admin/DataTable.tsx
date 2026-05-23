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
  return (
    <div className="w-full rounded-2xl border border-stormy-teal/15 bg-card-background/60 shadow-lg overflow-hidden backdrop-blur-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stormy-teal/15 bg-ink-black/20">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-2xs font-extrabold tracking-wider text-stormy-teal uppercase ${
                    col.sortable ? "cursor-pointer select-none hover:text-vivid-tangerine" : ""
                  }`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-2xs font-bold text-vivid-tangerine">
                        {sortOrder === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stormy-teal/10">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 bg-stormy-teal/10 rounded-md w-2/3"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-xs text-text-secondary/60">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-stormy-teal/5 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-xs font-semibold text-foreground/90">
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-stormy-teal/15 bg-ink-black/10 flex items-center justify-between gap-4">
          <span className="text-2xs font-bold text-text-secondary/60 uppercase tracking-wider">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="px-3 py-1.5 rounded-lg border border-stormy-teal/15 text-2xs font-extrabold uppercase tracking-wider hover:bg-stormy-teal/10 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="px-3 py-1.5 rounded-lg border border-stormy-teal/15 text-2xs font-extrabold uppercase tracking-wider hover:bg-stormy-teal/10 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
