import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 ${sizes[size]} ${className}`} />
  );
};

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
    </div>
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-2/3" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="h-10 bg-gray-100 rounded flex-1" />
        <div className="h-10 bg-gray-100 rounded w-24" />
        <div className="h-10 bg-gray-100 rounded w-20" />
      </div>
    ))}
  </div>
);
