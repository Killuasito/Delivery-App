export const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
    <div className="w-full h-40 bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="flex items-center justify-between mt-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl w-28" />
      </div>
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 p-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);