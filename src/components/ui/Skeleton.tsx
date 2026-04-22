import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  count = 1,
  height = 'h-4',
  width = 'w-full'
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-300 dark:bg-gray-600 rounded ${height} ${width} ${className}`}
        />
      ))}
    </>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div 
    className={`p-4 rounded-lg border animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}
  >
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton height="h-4" width="w-3/4" />
        <Skeleton height="h-3" width="w-1/2" />
        <Skeleton height="h-3" width="w-1/3" />
        <div className="mt-3 space-y-1">
          <Skeleton height="h-3" width="w-full" />
          <Skeleton height="h-3" width="w-2/3" />
        </div>
      </div>
      <Skeleton height="h-6" width="w-6" className="rounded-full" />
    </div>
  </div>
);

export const SkeletonForm: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton height="h-4" width="w-24" />
        <Skeleton height="h-10" width="w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton height="h-4" width="w-20" />
        <Skeleton height="h-10" width="w-full" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton height="h-4" width="w-16" />
      <Skeleton height="h-10" width="w-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} height="h-20" width="w-full" />
      ))}
    </div>
    <Skeleton height="h-10" width="w-full" />
  </div>
);

export default Skeleton;