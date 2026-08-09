import Skeleton from "./Skeleton";

export default function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden" role="status" aria-label="Loading data">
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 0 ? "w-1/3" : "flex-1 max-w-32"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}