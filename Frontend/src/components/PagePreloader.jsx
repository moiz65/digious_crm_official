import React from 'react';

/**
 * Reusable PagePreloader component for HR department pages.
 * Shows a professional skeleton + spinner overlay while data loads.
 *
 * Usage:
 *   <PagePreloader loading={loading} message="Loading attendance data..." />
 *   {!loading && <YourContent />}
 *
 * Or wrap content:
 *   <PagePreloader loading={loading} message="Loading...">
 *     <YourContent />
 *   </PagePreloader>
 */

// Skeleton line placeholder
const SkeletonLine = ({ width = '100%', height = '16px', className = '' }) => (
  <div
    className={`bg-gray-200 rounded animate-pulse ${className}`}
    style={{ width, height }}
  />
);

// Skeleton card placeholder
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
    <div className="flex items-center justify-between">
      <SkeletonLine width="40%" height="14px" />
      <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
    </div>
    <SkeletonLine width="60%" height="28px" />
    <SkeletonLine width="30%" height="12px" />
  </div>
);

// Skeleton table row
const SkeletonTableRow = () => (
  <div className="flex items-center gap-4 py-3 px-4">
    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
    <SkeletonLine width="20%" height="14px" />
    <SkeletonLine width="15%" height="14px" />
    <SkeletonLine width="12%" height="14px" />
    <SkeletonLine width="10%" height="14px" />
    <SkeletonLine width="10%" height="14px" />
  </div>
);

// Full-page skeleton layout
const PageSkeleton = ({ variant = 'dashboard' }) => {
  if (variant === 'table') {
    return (
      <div className="space-y-3 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <SkeletonLine width="200px" height="24px" />
          <div className="flex gap-3">
            <SkeletonLine width="120px" height="36px" className="rounded-lg" />
            <SkeletonLine width="120px" height="36px" className="rounded-lg" />
          </div>
        </div>
        {/* Filter bar skeleton */}
        <div className="flex gap-3 mb-4">
          <SkeletonLine width="200px" height="40px" className="rounded-lg" />
          <SkeletonLine width="150px" height="40px" className="rounded-lg" />
          <SkeletonLine width="150px" height="40px" className="rounded-lg" />
        </div>
        {/* Table header */}
        <div className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-lg">
          <SkeletonLine width="20%" height="12px" />
          <SkeletonLine width="15%" height="12px" />
          <SkeletonLine width="12%" height="12px" />
          <SkeletonLine width="10%" height="12px" />
          <SkeletonLine width="10%" height="12px" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
          <SkeletonLine width="60%" height="20px" />
          <SkeletonLine width="100%" height="200px" className="rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
          <SkeletonLine width="50%" height="18px" />
          <SkeletonLine width="100%" height="40px" className="rounded-lg" />
          <SkeletonLine width="100%" height="40px" className="rounded-lg" />
          <SkeletonLine width="100%" height="40px" className="rounded-lg" />
        </div>
      </div>
    </div>
  );
};

// Spinner component
const Spinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
};

// Inline preloader (for sections within a page)
export const InlinePreloader = ({ loading, message = 'Loading...', children, variant = 'spinner', minHeight = '200px' }) => {
  if (!loading && children) return <>{children}</>;

  if (!loading) return null;

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      style={{ minHeight }}
    >
      {variant === 'skeleton' ? (
        <PageSkeleton variant="table" />
      ) : (
        <>
          <Spinner size="md" />
          <p className="text-sm text-gray-500 font-medium animate-pulse">{message}</p>
        </>
      )}
    </div>
  );
};

// Main PagePreloader
const PagePreloader = ({ loading, message = 'Loading data...', children, variant = 'skeleton', overlay = false }) => {
  // If not loading and has children, show children
  if (!loading && children) return <>{children}</>;

  // If not loading and no children, return nothing
  if (!loading) return null;

  // Overlay mode - shows spinner on top of existing content
  if (overlay && children) {
    return (
      <div className="relative">
        {children}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-50 rounded-2xl">
          <Spinner size="lg" />
          <p className="mt-4 text-sm font-semibold text-gray-600 animate-pulse">{message}</p>
        </div>
      </div>
    );
  }

  // Full skeleton/spinner mode
  if (variant === 'skeleton') {
    return (
      <div className="w-full">
        <PageSkeleton />
        <div className="flex items-center justify-center gap-2 mt-4 py-3">
          <Spinner size="sm" />
          <p className="text-sm text-gray-500 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  // Simple spinner mode
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="xl" />
      <p className="text-base font-semibold text-gray-600 animate-pulse">{message}</p>
    </div>
  );
};

export { Spinner, PageSkeleton, SkeletonCard, SkeletonLine, SkeletonTableRow };
export default PagePreloader;
