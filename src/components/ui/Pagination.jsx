import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ page, limit, total, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
      <p className="text-sm text-gray-500 text-center sm:text-left">
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center justify-center gap-1 overflow-x-auto">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-btn hover:bg-gray-100 text-gray-500 disabled:opacity-30 min-h-[40px] min-w-[40px]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-9 h-9 rounded-btn text-sm font-medium shrink-0 ${
                pageNum === page
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-btn hover:bg-gray-100 text-gray-500 disabled:opacity-30 min-h-[40px] min-w-[40px]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
