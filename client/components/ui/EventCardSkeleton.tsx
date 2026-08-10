import Skeleton from "./Skeleton";

export default function EventCardSkeleton() {
  return (
    <div className="w-full block bg-surface border border-border rounded-lg shadow-sm lg:flex p-2 mb-4">
      {/* Image Skeleton */}
      <div className="w-full lg:w-[50%] relative h-75 bg-muted rounded-md overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Content Skeleton */}
      <div className="w-full lg:w-[50%] flex flex-col justify-center p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 rounded-md" />

        {/* Description */}
        <div className="space-y-2 py-1">
          <Skeleton className="h-4 w-full rounded-md" />
          {/* <Skeleton className="h-4 w-5/6 rounded-md" /> */}
        </div>

        {/* Price & Sold count */}
        <div className="flex py-2 items-baseline justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <Skeleton className="h-4 w-14 rounded-md" />
        </div>

        {/* CountDown Skeleton */}
        <Skeleton className="h-6 w-full rounded-lg" />

        <div className="pt-2"></div>

        {/* Buttons Skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-1/6 mr-1 rounded-lg" />
          <Skeleton className="h-12 w-1/6 rounded-lg" />
        </div>
      </div>
    </div>
  );
}