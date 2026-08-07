"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, disabled }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="w-full flex items-center justify-center gap-4 py-6">
      <button
        type="button"
        disabled={currentPage <= 1 || disabled}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-4 py-2 rounded-md bg-[#3957db] text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Previous
      </button>
      <span className="text-sm text-[#00000082]">
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage >= totalPages || disabled}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-4 py-2 rounded-md bg-[#3957db] text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Next
      </button>
    </div>
  );
}