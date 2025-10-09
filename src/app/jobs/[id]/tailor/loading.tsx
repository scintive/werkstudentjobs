export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Preparing Tailor Studio</p>
          <p className="text-sm text-gray-600 mt-1">Loading your personalized editor...</p>
        </div>
      </div>
    </div>
  )
}
