interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({ className = '', count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer ${className}`}
        />
      ))}
    </>
  );
}

export function ProductSkeleton() {
  return (
    <div className="paper-card p-4">
      <LoadingSkeleton className="h-48 w-full mb-4" />
      <LoadingSkeleton className="h-4 w-3/4 mb-2" />
      <LoadingSkeleton className="h-4 w-1/2 mb-4" />
      <LoadingSkeleton className="h-6 w-1/4" />
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="paper-card p-6">
      <LoadingSkeleton className="h-6 w-1/3 mb-4" />
      <LoadingSkeleton className="h-4 w-full mb-2" />
      <LoadingSkeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-2">
        <LoadingSkeleton className="h-10 w-24" />
        <LoadingSkeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="paper-card p-6">
      <div className="flex items-center gap-4 mb-6">
        <LoadingSkeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1">
          <LoadingSkeleton className="h-6 w-1/2 mb-2" />
          <LoadingSkeleton className="h-4 w-1/3" />
        </div>
      </div>
      <LoadingSkeleton className="h-10 w-full mb-3" />
      <LoadingSkeleton className="h-10 w-full mb-3" />
      <LoadingSkeleton className="h-10 w-full" />
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="paper-card p-4 flex gap-4">
          <LoadingSkeleton className="h-24 w-24 flex-shrink-0" />
          <div className="flex-1">
            <LoadingSkeleton className="h-5 w-3/4 mb-2" />
            <LoadingSkeleton className="h-4 w-1/2 mb-4" />
            <LoadingSkeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
