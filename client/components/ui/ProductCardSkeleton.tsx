import Skeleton from "./Skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="w-full h-92.5 bg-white rounded-lg shadow-sm p-3">
      <Skeleton className="w-full h-42.5 rounded-md mb-3" />
      <Skeleton className="h-3.5 w-2/5 mb-2" />
      <Skeleton className="h-4 w-4/5 mb-3" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <div className="flex justify-between">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/5" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-4 lg:gap-6.25 xl:grid-cols-5 xl:gap-7.5 mb-12"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}