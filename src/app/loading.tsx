export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Inline spinner to avoid import issues */}
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-4 text-gray-600">Loading Metalyze...</p>
        <p className="mt-2 text-sm text-gray-500">
          First load may take a moment while we prepare everything
        </p>
      </div>
    </div>
  );
}